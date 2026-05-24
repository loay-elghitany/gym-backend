const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  checkIn,
  scanAttendance,
  getPeakHours,
} = require("../controllers/attendanceController");

const router = express.Router();
router.use(authMiddleware);

router.post("/check-in", checkIn);
router.post("/scan", scanAttendance);
router.post("/scan-qr", scanAttendance);
router.get("/peak-hours", getPeakHours);

module.exports = router;
