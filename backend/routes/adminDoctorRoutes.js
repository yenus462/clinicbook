const express = require("express");
const {
  listDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  setDoctorStatus,
  setWorkingHours,
  deleteDoctor,
} = require("../controllers/adminDoctorController");

const router = express.Router();

router.get("/", listDoctors);
router.post("/", createDoctor);
router.get("/:id", getDoctor);
router.put("/:id", updateDoctor);
router.patch("/:id/status", setDoctorStatus);
router.put("/:id/working-hours", setWorkingHours);
router.delete("/:id", deleteDoctor);

module.exports = router;