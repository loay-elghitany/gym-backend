const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getLeaderboard,
  getMyInBodyRecords,
} = require("../controllers/memberController");
const { logWorkout } = require("../controllers/workoutLogController");

const router = express.Router();
router.use(authMiddleware);

router.get("/inbody", getMyInBodyRecords);
router.get("/leaderboard", getLeaderboard);
router.post("/log-workout", logWorkout);

module.exports = router;
