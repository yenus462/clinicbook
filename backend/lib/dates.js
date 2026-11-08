require("dotenv").config();

// All clinic times are in this time zone (rule 17)
const CLINIC_TIME_ZONE = process.env.CLINIC_TIME_ZONE || "Africa/Addis_Ababa";

// Today's date in the clinic, as text like "2026-11-07"
function todayInClinic() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// The clinic's current date (text) and time (minutes since midnight), read together
function clinicNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type).value;

  return {
    date: get("year") + "-" + get("month") + "-" + get("day"),
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

// "09:30" becomes 570 (minutes since midnight), so times can be compared
function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// 570 becomes "09:30"
function minutesToTime(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return hours + ":" + minutes;
}

// Adds days to a date text: addDays("2026-11-07", 14) gives "2026-11-21"
function addDays(dateString, days) {
  const date = new Date(dateString + "T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

module.exports = {
  CLINIC_TIME_ZONE,
  todayInClinic,
  clinicNow,
  toMinutes,
  minutesToTime,
  addDays,
};