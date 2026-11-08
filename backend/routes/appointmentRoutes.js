const express = require("express");
const { createAppointment } = require("../controllers/appointmentController");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

// Rule 1: only logged-in patients can book
router.post("/", authenticate, requireRole("PATIENT"), createAppointment);

module.exports = router;