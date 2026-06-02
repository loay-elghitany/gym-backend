const express = require("express");
const {
  getTenantClasses,
  createClass,
  enrollSelf,
  cancelSelfEnrollment,
} = require("../controllers/gymClassController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.get(
  "/",
  authorize("member", "trainer", "gymowner", "superadmin"),
  getTenantClasses,
);
router.post("/", authorize("gymowner", "superadmin"), createClass);
router.post("/:classId/enroll", authorize("member"), enrollSelf);
router.delete("/:classId/enroll", authorize("member"), cancelSelfEnrollment);

module.exports = router;
