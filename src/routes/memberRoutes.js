const express = require("express");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const {
  getLeaderboard,
  getMyInBodyRecords,
  getExpiringMembers,
} = require("../controllers/memberController");
const { logWorkout } = require("../controllers/workoutLogController");

const router = express.Router();
router.use(authMiddleware);

router.get("/inbody", getMyInBodyRecords);
router.get("/leaderboard", getLeaderboard);
router.post("/log-workout", logWorkout);

// Gym owner route for expiring members
router.get(
  "/expiring",
  tenantMiddleware,
  authorize("gymowner"),
  getExpiringMembers
);

module.exports = router;
