const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { getActiveBroadcasts } = require("../controllers/broadcastController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getActiveBroadcasts);

module.exports = router;
