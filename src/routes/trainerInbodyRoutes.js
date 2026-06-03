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

// Trainer can delete member photos and records
router.delete(
  "/photos/:memberId/:photoId",
  authorize("trainer", "gymowner", "superadmin"),
  require("../controllers/trainerInbodyController").deleteMemberProgressPhoto,
);

router.delete(
  "/records/:memberId/:recordId",
  authorize("trainer", "gymowner", "superadmin"),
  require("../controllers/trainerInbodyController").deleteMemberInBodyRecord,
);

module.exports = router;
