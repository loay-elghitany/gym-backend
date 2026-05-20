const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  checkIn,
  getPeakHours,
} = require("../controllers/attendanceController");

const router = express.Router();
router.use(authMiddleware);

router.post("/check-in", checkIn);
router.get("/peak-hours", getPeakHours);

module.exports = router;
