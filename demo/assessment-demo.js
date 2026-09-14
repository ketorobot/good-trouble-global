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

  const bookingStory = {
    stages: [
      {
        date: 'Thursday, August 27 · 8:14 PM',
        title: 'Answer the question. Explain the options.',
        messages: [
          ['u', 'What’s included in your Signature Facial? My skin feels dry. Is it just a cleanse?'],
          ['a', 'It’s a 45-minute facial with cleansing, gentle exfoliation and a hydrating mask, for $150. Your esthetician checks your skin and tailors the visit with you.'],
          ['u', 'Do you have anything extra for hydration? And could I come after work?'],
          ['a', 'There’s an optional 10-minute Hydrating Finish for $30, making the total $180. The $150 facial is also available on its own. Which days work for you?']
        ],
        work: 'Used the spa’s service menu to explain what’s included and offer a relevant, clearly priced upgrade. No discount or pressure.',
        next: 'See the follow-up →'
      },
      {
        date: 'Thursday evening → Friday afternoon',
        title: 'Keep the conversation from going cold.',
        messages: [
          ['u', 'Monday after 4 would be good. I need to check work first though. Can you message me tomorrow?'],
          ['a', 'Of course. I’ll check back tomorrow afternoon.'],
          ['ok', 'Follow-up saved for Friday. Preference: Monday after 4 PM.'],
          ['ok', 'Friday, August 28 · 4:00 PM'],
          ['a', 'Hi Maya! Following up as you asked. Monday, August 31 at 4:30 is available for the facial with the Hydrating Finish: 55 minutes, $180 total. Would you like that appointment?']
        ],
        work: 'Remembered her availability, scheduled the follow-up she requested, and checked for enough time for both services before replying.',
        next: 'See what she booked →'
      },
      {
        date: 'Friday, August 28 · 4:08 PM',
        title: 'Finish the booking and save the details.',
        messages: [
          ['u', 'Yes, Monday at 4:30 works. Let’s do the facial and the extra hydration.'],
          ['a', 'Great. Here’s your booking link for both services, $180 total. Review the details and confirm there.'],
          ['ok', 'Maya completed the booking form and confirmed her appointment.'],
          ['a', 'You’re booked for Monday, August 31 at 4:30. Your confirmation includes the appointment details and a link to manage your booking.']
        ],
        work: 'Added the confirmed appointment to the calendar and kept the conversation with the booking. The client chose the upgrade; staff didn’t have to chase the inquiry.'
      }
    ]
  };
  window.GTDemo.bookingStory = bookingStory;
  const story = document.querySelector('#booking-story');
  if (story) {
    let step = 0;
    const details = story.querySelector('#story-details');
    const toggle = story.querySelector('.story-open');
    const next = story.querySelector('[data-story-next]');
    function renderStep(moveFocus = false) {
      const stage = bookingStory.stages[step];
      story.querySelector('#story-stage-title').textContent = stage.title;
      story.querySelector('#story-date').textContent = stage.date;
      story.querySelector('#story-work').textContent = stage.work;
      const messages = story.querySelector('#story-messages');
      messages.replaceChildren();
      stage.messages.forEach(([role, text]) => {
        const bubble = document.createElement('div');
        bubble.className = 'story-message story-' + role;
        if (role !== 'ok') {
          const sender = document.createElement('span');
          sender.textContent = role === 'u' ? 'Maya' : 'Your assistant';
          bubble.append(sender);
        }
        const copy = document.createElement('p');
        copy.textContent = text;
        bubble.append(copy);
        messages.append(bubble);
      });
      story.querySelectorAll('[data-story-step]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.storyStep) === step)));
      next.hidden = step === 2;
      next.textContent = stage.next || '';
      story.querySelector('#story-booking').hidden = step !== 2;
      story.querySelector('#story-links').hidden = step !== 2;
      if (moveFocus) story.querySelector('#story-stage-title').focus({preventScroll:true});
    }
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(expanded));
      details.hidden = !expanded;
      toggle.innerHTML = expanded ? 'Close the story <span aria-hidden="true">↑</span>' : 'See how it happened <span aria-hidden="true">↓</span>';
    });
    story.querySelectorAll('[data-story-step]').forEach(button => button.addEventListener('click', () => {
      step = Number(button.dataset.storyStep);
      renderStep(true);
    }));
    next.addEventListener('click', () => {
      step++;
      renderStep(true);
      story.querySelector('.story-steps').scrollIntoView({behavior:'auto',block:'start'});
    });
    story.querySelector('[data-story-messages]').addEventListener('click', () => window.dispatchEvent(new Event('gt-story-messages')));
    story.querySelector('[data-story-calendar]').addEventListener('click', () => window.dispatchEvent(new Event('gt-story-calendar')));
    renderStep();
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
