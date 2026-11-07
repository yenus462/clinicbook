const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s]{7,15}$/;

// bcrypt only uses the first 72 characters of a password
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Returns { errors: [...], values: {...cleaned...} }
function validateRegister(body) {
  const errors = [];

  const name = cleanText(body.name);
  const email = cleanText(body.email).toLowerCase();
  const phone = cleanText(body.phone);
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2 || name.length > 100) {
    errors.push("Name must be between 2 and 100 characters.");
  }
  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    errors.push("Please enter a valid email address.");
  }
  if (!PHONE_REGEX.test(phone)) {
    errors.push("Phone must be 7 to 15 digits (you may use + - and spaces).");
  }
  if (password.length < PASSWORD_MIN) {
    errors.push("Password must be at least 8 characters.");
  } else if (password.length > PASSWORD_MAX) {
    errors.push("Password must be at most 72 characters.");
  }

  return { errors, values: { name, email, phone, password } };
}

function validateLogin(body) {
  const errors = [];

  const email = cleanText(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email) errors.push("Email is required.");
  if (!password) errors.push("Password is required.");
  if (password.length > PASSWORD_MAX) errors.push("Password is too long.");

  return { errors, values: { email, password } };
}

module.exports = { validateRegister, validateLogin };