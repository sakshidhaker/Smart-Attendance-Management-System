const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { overview } = require("../controllers/statsController");

const router = express.Router();

router.get("/overview", protect, authorize("faculty", "admin"), overview);

module.exports = router;
