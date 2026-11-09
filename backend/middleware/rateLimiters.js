require("dotenv").config();
const rateLimit = require("express-rate-limit");

// Login and register attempts allowed per 15 minutes per IP.
// Production keeps the default of 10. For local testing, set AUTH_RATE_LIMIT in .env.
const authLimit = Number(process.env.AUTH_RATE_LIMIT) || 10;

// General limit for the whole API: 300 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { message: "Too many requests. Please try again later." } },
});

// Strict limit for login and register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authLimit,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: { message: "Too many login attempts. Please try again in 15 minutes." },
  },
});

module.exports = { apiLimiter, authLimiter, authLimit };