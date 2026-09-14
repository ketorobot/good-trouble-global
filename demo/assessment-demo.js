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
    review(title, why, action) {
      if (pending) return Promise.resolve(false);
      previousFocus = document.activeElement;
      dialog.querySelector('h2').textContent = title;
      dialog.querySelector('#approval-why').textContent = why;
      dialog.querySelector('#approval-action').textContent = action;
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
    const scenarios = {
      capacity: {
        title: 'Fill a cancellation',
        problem: 'Thursday at 1:30 opens up. Maria G. is on the sample waitlist for that service and time.',
        response: 'Propose an invitation to Maria using approved availability. Hold off on broader outreach while this opening is the priority.',
        action: 'Simulate sending Maria: “A Thursday 1:30 appointment is available. Would you like it?” An invitation is not a confirmed booking.',
        result: 'Invitation simulated. The appointment stays open until Maria accepts. Next measure: invitations that become confirmed bookings.'
      },
      consults: {
        title: 'Follow up on a consultation inquiry',
        problem: 'Ana asked about a Friday consultation after hours but has not chosen a time.',
        response: 'Prioritize an approved consultation follow-up to Ana. Pause the cancellation invitation so the next action matches your current goal.',
        action: 'Simulate sending Ana: “Would you like help finding a Friday consultation time?” Staff handles clinical questions and exceptions.',
        result: 'Follow-up simulated. Ana stays an unbooked inquiry until she chooses and confirms a time. Next measure: inquiries that become consultations.'
      }
    };
    const select = guide.querySelector('select'), approve = guide.querySelector('[data-guide-approve]');
    function render() {
      const scenario = scenarios[select.value];
      guide.querySelector('[data-problem]').textContent = scenario.problem;
      guide.querySelector('[data-response]').textContent = scenario.response;
      guide.querySelector('[role=status]').textContent = '';
      approve.disabled = false;
      approve.textContent = 'Review proposed action';
    }
    select.addEventListener('change', render);
    guide.querySelector('[data-replay]').addEventListener('click', render);
    approve.addEventListener('click', async () => {
      const scenario = scenarios[select.value];
      if (!await window.GTDemo.review(scenario.title, scenario.response, scenario.action)) return;
      guide.querySelector('[role=status]').textContent = scenario.result;
      approve.textContent = 'Action simulated';
      approve.disabled = true;
    });
    guide.querySelector('[data-explore]').addEventListener('click', () => {
      document.querySelector('[data-s="more"]')?.click();
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
