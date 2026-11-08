const express = require("express");
const { getStats } = require("../controllers/adminStatsController");

const router = express.Router();

router.get("/", getStats);

module.exports = router;