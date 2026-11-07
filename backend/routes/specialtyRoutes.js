const express = require("express");
const { listSpecialties } = require("../controllers/specialtyController");

const router = express.Router();

router.get("/", listSpecialties);

module.exports = router;