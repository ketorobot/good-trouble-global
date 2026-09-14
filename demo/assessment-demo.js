/* Shared interaction helpers for illustrative demos. No external actions are sent. */
(() => {
  'use strict';
  const dialog = document.createElement('dialog');
  dialog.className = 'approval';
  dialog.setAttribute('aria-labelledby', 'approval-title');
  dialog.innerHTML = '<h2 id="approval-title"></h2><p id="approval-why"></p><p id="approval-action"></p><small>Simulation only. No message, booking, purchase or payment leaves this demo.</small><button type="button" data-confirm>Confirm simulation</button><button type="button" class="secondary" data-cancel>Keep pending</button>';
  document.body.append(dialog);
  let pending = null, previousFocus = null;
  function finish(value) {
    if (!pending) return;
    const resolve = pending;
    pending = null;
    dialog.close();
    previousFocus?.focus();
    resolve(value);
  }
  window.GTDemo = {
    review(title, why, action, options = {}) {
      if (pending) return Promise.resolve(false);
      previousFocus = document.activeElement;
      dialog.querySelector('h2').textContent = title;
      dialog.querySelector('#approval-why').textContent = why;
      dialog.querySelector('#approval-action').textContent = action;
      dialog.querySelector('[data-confirm]').textContent = options.confirmLabel || 'Confirm simulation';
      dialog.querySelector('[data-cancel]').textContent = options.cancelLabel || 'Keep pending';
      dialog.querySelector('small').textContent = options.note || 'Simulation only. No message, booking, purchase or payment leaves this demo.';
      dialog.showModal();
      dialog.querySelector('[data-cancel]').focus();
      return new Promise(resolve => { pending = resolve; });
    }
  };
  dialog.querySelector('[data-confirm]').addEventListener('click', () => finish(true));
  dialog.querySelector('[data-cancel]').addEventListener('click', () => finish(false));
  dialog.addEventListener('cancel', e => { e.preventDefault(); finish(false); });

  const guide = document.querySelector('#first-workflow');
  if (guide) {
    const scenarios = [
      {
        title: 'An appointment opened up.',
        time: 'Thursday · 1:30 PM',
        problem: 'Maria G. is on the waitlist for this time. Invite her to take the opening.',
        button: 'Review invitation',
        recipient: 'Maria G.',
        message: 'Hi Maria! A Thursday appointment at 1:30 PM just opened up. Would you like it?',
        confirm: 'Send invitation',
        sent: 'Invitation sent',
        result: 'Waiting for Maria to reply. The appointment is still open.'
      },
      {
        title: 'A consultation inquiry needs a reply.',
        time: 'Ana · Asked about Friday',
        problem: 'Ana wants to book a consultation. Follow up to help her find a time.',
        button: 'Review follow-up',
        recipient: 'Ana',
        message: 'Hi Ana! Would you like help finding a consultation time this Friday?',
        confirm: 'Send follow-up',
        sent: 'Follow-up sent',
        result: 'Waiting for Ana to reply. No consultation is booked yet.'
      }
    ];
    let current = 0;
    const approve = guide.querySelector('[data-guide-approve]');
    const replay = guide.querySelector('[data-replay]');
    function render() {
      const scenario = scenarios[current];
      guide.querySelector('h2').textContent = scenario.title;
      guide.querySelector('[data-time]').textContent = scenario.time;
      guide.querySelector('[data-problem]').textContent = scenario.problem;
      guide.querySelector('[role=status]').textContent = '';
      approve.disabled = false;
      approve.textContent = scenario.button;
      replay.hidden = true;
    }
    replay.addEventListener('click', () => {
      current = (current + 1) % scenarios.length;
      render();
      approve.focus();
    });
    approve.addEventListener('click', async () => {
      const scenario = scenarios[current];
      if (!await window.GTDemo.review('Review your message', 'To: ' + scenario.recipient + ' · Text message', scenario.message, {
        confirmLabel: scenario.confirm,
        cancelLabel: 'Back',
        note: 'Demo only. No real message will be sent.'
      })) return;
      guide.querySelector('[role=status]').textContent = scenario.result;
      approve.textContent = scenario.sent + ' ✓';
      approve.disabled = true;
      replay.hidden = false;
      replay.focus();
    });
    render();
  }

  const rating = document.querySelector('#review-rating');
  if (rating) {
    function renderReview() {
      document.querySelector('#review-invitation').textContent = 'Public review invitation: included. “Thank you for visiting. If you would like to share your experience, you can leave an honest review.”';
      document.querySelector('#review-recovery').textContent = Number(rating.value) <= 3
        ? 'Separate staff task: follow up privately on the concern. The public invitation stays available.'
        : 'Private support remains available. No service concern has been raised in this example.';
    }
    rating.addEventListener('change', renderReview);
    renderReview();
  }
})();
