"use strict";

const samples = {
  "after-hours": {
    request: "Thursday, 6:42 p.m.",
    preference: "Friday morning",
    owner: "Maya, opening intake shift",
    attempt: "Friday, 9:08 a.m.",
    outcome: "Maya left a voicemail and logged the attempt."
  },
  overflow: {
    request: "Tuesday, 11:10 a.m.",
    preference: "Today after lunch",
    owner: "Jordan, afternoon intake",
    attempt: "Awaiting staff action",
    outcome: "Jordan has the request. The caller’s preferred time is recorded."
  },
  "delivery-issue": {
    request: "Monday, 4:16 p.m.",
    preference: "Before the office closes",
    owner: "Sam, backup intake lead",
    attempt: "No attempt recorded",
    outcome: "The first delivery failed. Sam sees the exception and can call from the backup queue."
  }
};

const switcher = document.querySelector(".scenario-switch");
const choices = switcher.querySelectorAll("button[data-scenario]");
const fields = document.querySelectorAll(".sample-result [data-field]");

for (const choice of choices) {
  choice.addEventListener("click", () => {
    const sample = samples[choice.dataset.scenario];
    for (const field of fields) {
      field.textContent = sample[field.dataset.field];
    }
    for (const button of choices) {
      button.setAttribute("aria-pressed", String(button === choice));
    }
  });
}
switcher.hidden = false;
