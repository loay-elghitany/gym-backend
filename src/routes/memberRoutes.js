const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getLeaderboard,
  getMyInBodyRecords,
} = require("../controllers/memberController");

const router = express.Router();
router.use(authMiddleware);

router.get("/inbody", getMyInBodyRecords);
router.get("/leaderboard", getLeaderboard);

module.exports = router;
