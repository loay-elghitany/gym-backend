const express = require("express");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const {
  getLeaderboard,
  getMyInBodyRecords,
  getExpiringMembers,
  uploadProgressPhoto,
  getMyProgressPhotos,
  deleteProgressPhoto,
  uploadInBodyRecord,
  getMyInBodyRecordsExtended,
  getMemberProgress,
} = require("../controllers/memberController");
const { logWorkout } = require("../controllers/workoutLogController");

const router = express.Router();
router.use(authMiddleware);

// InBody (legacy)
router.get("/inbody", getMyInBodyRecords);

// Progress photos
router.post("/progress-photos", uploadProgressPhoto);
router.get("/progress-photos", getMyProgressPhotos);
router.delete("/progress-photos/:photoId", deleteProgressPhoto);

// InBody records (member uploads)
router.post("/inbody-records", uploadInBodyRecord);
router.get("/inbody-records", getMyInBodyRecordsExtended);

// Leaderboard
router.get("/leaderboard", getLeaderboard);

// Workout logging
router.post("/log-workout", logWorkout);

// Gym owner route for expiring members
router.get(
  "/expiring",
  tenantMiddleware,
  authorize("gymowner"),
  getExpiringMembers,
);

// Trainer route to get member progress (photos and InBody records)
router.get(
  "/progress/:memberId",
  tenantMiddleware,
  authorize("trainer"),
  getMemberProgress,
);

module.exports = router;
