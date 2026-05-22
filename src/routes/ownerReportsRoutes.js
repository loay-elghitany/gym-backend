const express = require("express");
const {
  getDashboard,
  notifyMember,
  exportMembers,
} = require("../controllers/ownerReportsController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", authorize("gymowner", "superadmin"), getDashboard);
router.post(
  "/notify/:memberId",
  authorize("gymowner", "superadmin"),
  notifyMember,
);
router.get("/export", authorize("gymowner", "superadmin"), exportMembers);

module.exports = router;
