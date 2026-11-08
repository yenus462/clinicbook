const express = require("express");
const { listDoctors, getDoctor } = require("../controllers/doctorController");
const { getDoctorSlots } = require("../controllers/availabilityController");

const router = express.Router();

router.get("/", listDoctors);
router.get("/:id/slots", getDoctorSlots);
router.get("/:id", getDoctor);

module.exports = router;