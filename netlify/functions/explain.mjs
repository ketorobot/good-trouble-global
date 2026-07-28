const DEFAULT_ORIGINS = [
  "https://goodtroubleglobal.com",
  "https://www.goodtroubleglobal.com",
  "https://good-trouble-global.netlify.app",
  "http://localhost:8888",
  "http://localhost:3000",
  "http://127.0.0.1:8888",
];

const ALLOWED_ORIGINS = new Set([
  ...DEFAULT_ORIGINS,
  ...(process.env.EXPLAIN_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
]);

const MODEL = process.env.EXPLAIN_MODEL || "claude-haiku-4-5-20251001";
const MAX_TOKENS = Number(process.env.EXPLAIN_MAX_TOKENS || 700);
const MAX_FACT_LEN = 500;
const MAX_CATEGORY_LEN = 60;

const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 20;
const buckets = new Map();

const SYSTEM_PROMPT = `You explain single facts to a curious adult scrolling a rapid-fire facts feed on their phone. They just tapped "Explain" on the fact below. Give them the version a great science or history writer would give at a bar: fast, concrete, and genuinely interesting.

Write exactly three short paragraphs. No headings, no bullet lists, no preamble, and never restate the fact back to them.

Paragraph 1 - what is actually going on underneath it: the mechanism, the history, or how we know it is true.
Paragraph 2 - the thing that makes the scale or the strangeness land: a comparison, a number translated into human terms, or the detail almost everyone misses.
Paragraph 3 - the kicker: a consequence, an unresolved question, or the place this connects to something the reader already cares about.

Rules:
- 160-240 words total.
- Plain language. No jargon unless you define it in the same breath.
- Specific over general: real names, dates, numbers, places.
- Never open with "This fact", "Great question", "Interestingly", or similar.
- No filler, no moralising, no cheerleading, no closing summary line.
- Bold at most two short phrases using **double asterisks**.
- If the fact is oversimplified, contested, or out of date, say so plainly in one clause and give the better version.`;

const ORIGIN_RE = /^https:\/\/([a-z0-9-]+--)?good-trouble-global\.netlify\.app$/i;

function originAllowed(o) {
  if (!o) return true;
  if (ALLOWED_ORIGINS.has(o)) return true;
  return ORIGIN_RE.test(o);
}

function corsHeaders(origin) {
  const h = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && originAllowed(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function err(status, message, origin) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

function rateLimited(ip) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.start > WINDOW_MS) {
    if (buckets.size > 5000) buckets.clear();
    buckets.set(ip, { start: now, count: 1 });
    return false;
  }
  b.count += 1;
  return b.count > MAX_PER_WINDOW;
}

export default async (req, context) => {
  const origin = req.headers.get("origin") || "";
  const API_KEY = (process.env.ANTHROPIC_API_KEY || "").trim();

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });

  if (req.method === "GET" && new URL(req.url).searchParams.get("diag") === "1") {
    return new Response(
      JSON.stringify({
        hasKey: API_KEY.length > 0,
        prefixOk: API_KEY.startsWith("sk-ant-"),
        hadWhitespace: API_KEY !== (process.env.ANTHROPIC_API_KEY || ""),
        model: MODEL,
        context: process.env.CONTEXT || "unknown",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
    );
  }

  if (req.method !== "POST") return err(405, "Method not allowed", origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return err(403, "Forbidden origin", origin);
  if (!API_KEY) return err(500, "Server missing ANTHROPIC_API_KEY", origin);

  const ip =
    req.headers.get("x-nf-client-connection-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    (context && context.ip) ||
    "unknown";
  if (rateLimited(ip)) return err(429, "Slow down a moment, then try again.", origin);

  let body;
  try {
    body = await req.json();
  } catch {
    return err(400, "Invalid JSON body", origin);
  }

  const fact = typeof body?.fact === "string" ? body.fact.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim().slice(0, MAX_CATEGORY_LEN) : "";

  if (!fact) return err(400, "Missing 'fact'", origin);
  if (fact.length > MAX_FACT_LEN) return err(413, "Fact too long", origin);

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Category: ${category || "General"}\n\nFact: ${fact}` }],
      }),
    });
  } catch {
    return err(502, "Upstream request failed", origin);
  }

  if (!upstream.ok || !upstream.body) {
    let detail = "";
    try {
      detail = (await upstream.text()).slice(0, 300);
    } catch {}
    return err(upstream.status === 429 ? 429 : 502, `Model error${detail ? ": " + detail : ""}`, origin);
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta" && evt.delta.text) {
                controller.enqueue(encoder.encode(evt.delta.text));
              } else if (evt.type === "error") {
                controller.enqueue(encoder.encode("\n\n[stream error]"));
              }
            } catch {}
          }
        }
      } catch {
        try {
          controller.enqueue(encoder.encode("\n\n[connection interrupted]"));
        } catch {}
      } finally {
        try {
          reader.cancel();
        } catch {}
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
      ...corsHeaders(origin),
    },
  });
};

export const config = { path: "/api/explain" };
