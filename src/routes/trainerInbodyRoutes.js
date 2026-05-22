const express = require("express");
const {
  getInBodyRecords,
  createInBodyRecord,
} = require("../controllers/trainerInbodyController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.get(
  "/:memberId",
  authorize("trainer", "gymowner", "superadmin"),
  getInBodyRecords,
);
router.post(
  "/",
  authorize("trainer", "gymowner", "superadmin"),
  createInBodyRecord,
);

module.exports = router;
