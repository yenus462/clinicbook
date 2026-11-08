const { toMinutes } = require("./dates");

// Times must be on 30-minute steps, like 09:00 or 09:30
const TIME_REGEX = /^([01]\d|2[0-3]):(00|30)$/;
const URL_REGEX = /^https?:\/\/\S+$/i;

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Turns "3" into 3, or returns null if it is not a positive whole number
function parseId(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function validateSpecialtyName(body) {
  const errors = [];
  const name = cleanText(body.name);

  if (name.length < 2 || name.length > 60) {
    errors.push("Specialty name must be between 2 and 60 characters.");
  }
  return { errors, values: { name } };
}

function validateDoctor(body) {
  const errors = [];

  const name = cleanText(body.name);
  const description = cleanText(body.description);
  const specialtyId = parseId(body.specialtyId);

  let photoUrl = null;
  if (body.photoUrl !== undefined && body.photoUrl !== null && body.photoUrl !== "") {
    const url = cleanText(body.photoUrl);
    if (!URL_REGEX.test(url) || url.length > 500) {
      errors.push("Photo URL must start with http:// or https:// (max 500 characters).");
    } else {
      photoUrl = url;
    }
  }

  if (name.length < 2 || name.length > 100) {
    errors.push("Doctor name must be between 2 and 100 characters.");
  }
  if (description.length < 5 || description.length > 500) {
    errors.push("Description must be between 5 and 500 characters.");
  }
  if (!specialtyId) {
    errors.push("A valid specialtyId is required.");
  }

  return { errors, values: { name, description, specialtyId, photoUrl } };
}

// Checks a weekly schedule: [{ dayOfWeek: 1, startTime: "09:00", endTime: "16:00" }, ...]
function validateWorkingHours(input) {
  const errors = [];
  const hours = [];

  if (!Array.isArray(input)) {
    return { errors: ["workingHours must be a list."], hours };
  }
  if (input.length > 7) {
    return { errors: ["workingHours can have at most 7 entries."], hours };
  }

  const seenDays = new Set();

  for (const item of input) {
    const dayOfWeek = item && item.dayOfWeek;
    const startTime = item && item.startTime;
    const endTime = item && item.endTime;

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      errors.push("dayOfWeek must be a whole number from 0 (Sunday) to 6 (Saturday).");
      continue;
    }
    if (seenDays.has(dayOfWeek)) {
      errors.push("Each weekday can appear only once (day " + dayOfWeek + " is repeated).");
      continue;
    }
    seenDays.add(dayOfWeek);

    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      errors.push("Times must look like 09:00 or 09:30 (30-minute steps), for day " + dayOfWeek + ".");
      continue;
    }
    if (toMinutes(startTime) >= toMinutes(endTime)) {
      errors.push("Start time must be before end time, for day " + dayOfWeek + ".");
      continue;
    }

    hours.push({ dayOfWeek, startTime, endTime });
  }

  return { errors, hours };
}

module.exports = {
  parseId,
  validateSpecialtyName,
  validateDoctor,
  validateWorkingHours,
};