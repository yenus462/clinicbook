const express = require("express");
const {
  listSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} = require("../controllers/adminSpecialtyController");

const router = express.Router();

router.get("/", listSpecialties);
router.post("/", createSpecialty);
router.put("/:id", updateSpecialty);
router.delete("/:id", deleteSpecialty);

module.exports = router;