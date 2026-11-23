(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  const mobile = matchMedia('(max-width:800px)');
  function closeMenu() {
    nav?.classList.toggle('is-collapsed', mobile.matches);
    menu?.setAttribute('aria-expanded', 'false');
  }
  closeMenu();
  mobile.addEventListener('change', closeMenu);
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-collapsed', !open);
  });
  nav?.addEventListener('click', event => {
    if (event.target.closest('a') && mobile.matches) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  const controls = document.querySelector('.example-controls');
  if (controls) {
    const stages = {
      inquiry: {
        label: 'A new inquiry',
        messages: [
          ['client', 'I was in a car accident. Can I talk to someone about it?'],
          ['assistant', 'I’m the firm’s AI assistant. I can help arrange a call with the intake team. Is this a good number to reach you?'],
          ['client', 'Yes, but I can’t talk right now. Can you check back tomorrow afternoon?'],
          ['assistant', 'Of course. I’ll check back tomorrow afternoon.']
        ],
        takeaway: 'The person gets a response. Your team gets the details without starting the conversation over.',
        note: 'Your team decides what the assistant can say and when a person should take over.'
      },
      followup: {
        label: 'The next afternoon',
        messages: [
          ['assistant', 'Hi, it’s the firm’s AI assistant. You asked us to check back this afternoon. Would you still like to speak with the intake team?'],
          ['client', 'Yes, tomorrow morning would be good.'],
          ['assistant', 'Here’s the calendar to choose a time. The intake team will call you at the number you shared.']
        ],
        takeaway: 'The follow-up happens when the person asked for it. Your staff has one less thing to remember.',
        note: 'A booking link can connect the conversation to your team’s available appointments.'
      },
      handoff: {
        label: 'Ready for your team',
        messages: [
          ['client', 'I booked Wednesday at 10. Thanks.'],
          ['assistant', 'You’re booked for Wednesday at 10 a.m. The intake team will call you then.']
        ],
        takeaway: 'Your team has the appointment, contact details, and conversation together. They can focus on the person.',
        note: 'Your intake team takes it from here. They ask the case questions and decide how the firm can help.'
      }
    };
    controls.hidden = false;
    for (const button of controls.querySelectorAll('button[data-stage]')) {
      button.addEventListener('click', () => {
        const stage = stages[button.dataset.stage];
        document.querySelector('#example-label').textContent = stage.label;
        document.querySelector('#example-takeaway').textContent = stage.takeaway;
        document.querySelector('#example-note').textContent = stage.note;
        const messages = stage.messages.map(([speaker, text]) => {
          const message = document.createElement('p');
          message.className = 'bubble ' + speaker;
          message.textContent = text;
          return message;
        });
        document.querySelector('#example-messages').replaceChildren(...messages);
        for (const choice of controls.querySelectorAll('button')) {
          choice.setAttribute('aria-pressed', String(choice === button));
        }
      });
    }
  }
  const form = document.querySelector('#law-contact');
  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('[type="submit"]');
      const status = document.querySelector('#law-form-status');
      button.disabled = true;
      button.textContent = 'Sending…';
      status.textContent = '';
      try {
        const response = await fetch('/law/', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams(new FormData(form)).toString(),
          signal: AbortSignal.timeout(20000)
        });
        if (!response.ok) throw new Error('Message not confirmed');
        try { sessionStorage.setItem('gt-law-message-sent', '1'); } catch {}
        try { window.gtag?.('event', 'generate_lead', {form: 'law-contact'}); } catch {}
        location.assign(form.getAttribute('action'));
      } catch {
        status.replaceChildren(document.createTextNode('We couldn’t confirm your message was sent. Please try again, or email Alex at '));
        const email = document.createElement('a');
        email.href = 'mailto:alex@goodtroubleglobal.com';
        email.textContent = 'alex@goodtroubleglobal.com';
        status.append(email, document.createTextNode('.'));
        button.disabled = false;
        button.textContent = 'Send your message';
      }
    });
  }
  const receipt = document.querySelector('#law-receipt-title');
  if (receipt) {
    try {
      if (sessionStorage.getItem('gt-law-message-sent') === '1') {
        receipt.textContent = 'Thanks for getting in touch.';
        document.querySelector('#law-receipt-copy').textContent = 'Your message has been sent. We’ll reply to the email you shared and find a time to talk about your firm.';
        sessionStorage.removeItem('gt-law-message-sent');
      }
    } catch {}
  }
})();
