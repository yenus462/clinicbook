const express = require("express");
const { listDoctors, getDoctor } = require("../controllers/doctorController");

const router = express.Router();

router.get("/", listDoctors);
router.get("/:id", getDoctor);

module.exports = router;