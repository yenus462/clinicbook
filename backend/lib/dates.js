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

// "09:30" becomes 570 (minutes since midnight), so times can be compared
function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Adds days to a date text: addDays("2026-11-07", 14) gives "2026-11-21"
function addDays(dateString, days) {
  const date = new Date(dateString + "T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

module.exports = { CLINIC_TIME_ZONE, todayInClinic, toMinutes, addDays };