const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get(
  "/forecast",
  authorize("gymowner", "superadmin"),
  analyticsController.getForecast,
);
router.get(
  "/",
  authorize("gymowner", "superadmin"),
  analyticsController.getOwnerMetrics,
);

module.exports = router;
