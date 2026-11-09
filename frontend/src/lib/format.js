// Helpers for dates, times and working hours.
// The clinic time zone matches the backend, so "today" is the same on both sides.

export const CLINIC_TIME_ZONE = "Africa/Addis_Ababa";
export const MAX_DAYS_AHEAD = 30;

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Monday first when showing a week (dayOfWeek: 0 = Sunday ... 6 = Saturday)
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Today's date in the clinic, as text like "2026-11-08"
export function todayInClinic() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// addDays("2026-11-08", 30) gives "2026-12-08"
export function addDays(dateString, days) {
  const date = new Date(dateString + "T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// "2026-11-16" becomes "Mon, 16 Nov 2026"
export function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00.000Z");
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Groups days that share the same hours: "Mon, Tue: 09:00 to 16:00 | Fri: 10:00 to 12:00"
export function formatWorkingHours(workingHours) {
  if (!workingHours || workingHours.length === 0) return "No working hours set";

  const groups = new Map();
  for (const day of DAY_ORDER) {
    const hours = workingHours.find((w) => w.dayOfWeek === day);
    if (!hours) continue;
    const key = hours.startTime + " to " + hours.endTime;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(DAY_SHORT[day]);
  }

  return Array.from(groups, ([time, days]) => days.join(", ") + ": " + time).join(" | ");
}

// "00:00", "00:30", ... "23:30" (30-minute steps, as the backend requires)
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, "0");
  const minutes = index % 2 === 0 ? "00" : "30";
  return hours + ":" + minutes;
});

// Turns saved working hours into 7 editable rows (Monday first)
export function hoursToRows(workingHours) {
  return DAY_ORDER.map((dayOfWeek) => {
    const hours = (workingHours || []).find((w) => w.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      enabled: Boolean(hours),
      startTime: hours ? hours.startTime : "09:00",
      endTime: hours ? hours.endTime : "16:00",
    };
  });
}

// Turns the editable rows back into the list the API expects
export function rowsToHours(rows) {
  return rows
    .filter((row) => row.enabled)
    .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));
}