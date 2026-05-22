const express = require("express");
const {
  createClass,
  getTenantClasses,
  enrollMember,
  markAttendance,
} = require("../controllers/gymClassController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.post("/", authorize("trainer", "gymowner", "superadmin"), createClass);
router.get(
  "/",
  authorize("trainer", "gymowner", "superadmin"),
  getTenantClasses,
);
router.post(
  "/:classId/enroll",
  authorize("trainer", "gymowner", "superadmin"),
  enrollMember,
);
router.patch(
  "/:classId/attendance",
  authorize("trainer", "gymowner", "superadmin"),
  markAttendance,
);

module.exports = router;
