const express = require("express");
const {
  createAppointment,
  listMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
} = require("../controllers/appointmentController");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

// Everything here is for logged-in patients only (rules 1 and 11)
router.use(authenticate, requireRole("PATIENT"));

router.post("/", createAppointment);
router.get("/me", listMyAppointments);
router.patch("/:id/cancel", cancelAppointment);
router.patch("/:id/reschedule", rescheduleAppointment);

module.exports = router;