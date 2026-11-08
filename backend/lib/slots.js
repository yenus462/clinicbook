const { todayInClinic, clinicNow, toMinutes, minutesToTime, addDays } = require("./dates");

const SLOT_MINUTES = 30; // rule 5
const MAX_DAYS_AHEAD = 30; // rule 8

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):(00|30)$/;

// True only for real dates in the form 2026-11-16 (rejects 2026-13-45)
function isValidDateString(value) {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTimeString(value) {
  return typeof value === "string" && TIME_REGEX.test(value);
}

// 0 = Sunday ... 6 = Saturday
function dayOfWeekOf(dateString) {
  return new Date(dateString + "T00:00:00.000Z").getUTCDay();
}

// All 30-minute start times that fit inside the working hours
function generateSlots(startTime, endTime) {
  const slots = [];
  const end = toMinutes(endTime);
  for (let m = toMinutes(startTime); m + SLOT_MINUTES <= end; m += SLOT_MINUTES) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

// Rules 7 and 8. Returns an error message, or null if the date can be booked.
function checkBookableDate(dateString) {
  const today = todayInClinic();
  if (dateString < today) {
    return "Past dates cannot be booked.";
  }
  if (dateString > addDays(today, MAX_DAYS_AHEAD)) {
    return "You can only book up to " + MAX_DAYS_AHEAD + " days ahead.";
  }
  return null;
}

// Rule 7 for today: a slot that has already started cannot be booked
function isPastSlot(dateString, time) {
  const now = clinicNow();
  if (dateString < now.date) return true;
  return dateString === now.date && toMinutes(time) <= now.minutes;
}

// The value stored in Appointment.slotKey while an appointment is BOOKED (rule 2)
function makeSlotKey(doctorId, dateString, time) {
  return doctorId + "_" + dateString + "_" + time;
}

module.exports = {
  SLOT_MINUTES,
  MAX_DAYS_AHEAD,
  isValidDateString,
  isValidTimeString,
  dayOfWeekOf,
  generateSlots,
  checkBookableDate,
  isPastSlot,
  makeSlotKey,
};