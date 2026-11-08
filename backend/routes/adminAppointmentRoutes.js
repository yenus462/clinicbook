const express = require("express");
const {
  listAppointments,
  getAppointment,
  setAppointmentStatus,
} = require("../controllers/adminAppointmentController");

const router = express.Router();

router.get("/", listAppointments);
router.get("/:id", getAppointment);
router.patch("/:id/status", setAppointmentStatus);

module.exports = router;