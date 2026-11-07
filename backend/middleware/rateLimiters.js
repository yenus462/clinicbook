const rateLimit = require("express-rate-limit");

// General limit for the whole API: 300 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { message: "Too many requests. Please try again later." } },
});

// Strict limit for login and register (used in Task 7): 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: { message: "Too many login attempts. Please try again in 15 minutes." },
  },
});

module.exports = { apiLimiter, authLimiter };