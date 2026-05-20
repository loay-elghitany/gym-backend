const express = require("express");
const {
  getChurnRadar,
  notifyInactiveMember,
} = require("../controllers/churnController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.get("/", authorize("gymowner", "superadmin"), getChurnRadar);
router.post(
  "/notify",
  authorize("gymowner", "superadmin"),
  notifyInactiveMember,
);

module.exports = router;
