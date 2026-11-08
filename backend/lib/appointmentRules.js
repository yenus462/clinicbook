const { clinicNow, toMinutes } = require("./dates");

// Rule 10: no cancelling or rescheduling within 2 hours of the start
const CHANGE_CUTOFF_MINUTES = 120;

// Minutes from now (clinic time) until an appointment starts.
// Negative means it has already started or passed.
function minutesUntil(dateString, time) {
  const now = clinicNow();
  const dayDifference = Math.round(
    (Date.parse(dateString + "T00:00:00.000Z") -
      Date.parse(now.date + "T00:00:00.000Z")) /
      86400000
  );
  return dayDifference * 1440 + toMinutes(time) - now.minutes;
}

module.exports = { CHANGE_CUTOFF_MINUTES, minutesUntil };