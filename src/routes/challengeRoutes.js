const express = require("express");
const router = express.Router();
const challengeController = require("../controllers/challengeController");

router.get("/", challengeController.listChallenges);
router.post("/:id/join", challengeController.joinChallenge);
router.get("/:id/leaderboard", challengeController.getLeaderboard);

module.exports = router;
