const express = require("express");
const {
  createWeeklyCheckIn,
  getTraineeCheckIns,
  getMyCheckIns,
  addTrainerFeedback,
} = require("../controllers/weeklyCheckInController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");

const weeklyCheckInRouter = express.Router();

// Trainee routes
weeklyCheckInRouter.post(
  "/trainee/checkin",
  tenantMiddleware,
  authMiddleware,
  authorize("member"),
  createWeeklyCheckIn
);

weeklyCheckInRouter.get(
  "/trainee/my-checkins",
  tenantMiddleware,
  authMiddleware,
  authorize("member"),
  getMyCheckIns
);

// Trainer routes
weeklyCheckInRouter.get(
  "/trainer/checkins/:traineeId",
  tenantMiddleware,
  authMiddleware,
  authorize("trainer"),
  getTraineeCheckIns
);

weeklyCheckInRouter.patch(
  "/trainer/checkins/:id/feedback",
  tenantMiddleware,
  authMiddleware,
  authorize("trainer"),
  addTrainerFeedback
);

module.exports = weeklyCheckInRouter;
