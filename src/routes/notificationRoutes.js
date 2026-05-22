const express = require("express");
const { authorize } = require("../middleware/authMiddleware");
const { checkExpirations } = require("../controllers/notificationController");

const router = express.Router();

router.post(
  "/check-expirations",
  authorize("gym_owner", "superadmin"),
  checkExpirations,
);

module.exports = router;
