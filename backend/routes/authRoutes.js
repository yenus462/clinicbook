const express = require("express");
const { register, login, me } = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");
const { authLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

// Strict rate limit: 10 attempts per 15 minutes per IP
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

// Needs a valid token
router.get("/me", authenticate, me);

// TEMPORARY: proves role protection works. We remove it in a later task.
router.get("/admin-ping", authenticate, requireRole("ADMIN"), (req, res) => {
  res.json({ message: "Hello admin " + req.user.name });
});

module.exports = router;