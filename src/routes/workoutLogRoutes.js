const express = require("express");
const router = express.Router();
const workoutLogController = require("../controllers/workoutLogController");

router.get("/", workoutLogController.getLogs);

module.exports = router;
