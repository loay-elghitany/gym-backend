const express = require("express");
const router = express.Router();
const { getGymReports } = require("../controllers/reportsController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

router.use(authMiddleware);
// Only gym owners and superadmins allowed
router.get("/", authorize("gymowner", "superadmin"), getGymReports);

module.exports = router;
