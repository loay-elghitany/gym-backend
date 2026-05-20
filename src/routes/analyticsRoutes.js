const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/forecast", analyticsController.getForecast);

module.exports = router;
const { authMiddleware, authorize } = require("../middleware/authMiddleware");
const { getOwnerMetrics } = require("../controllers/analyticsController");

router.use(authMiddleware);
router.get("/", authorize("gymowner", "superadmin"), getOwnerMetrics);

module.exports = router;
