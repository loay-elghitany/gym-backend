const express = require("express");
const { searchExercises } = require("../controllers/exerciseController");

const router = express.Router();

router.get("/search", searchExercises);

module.exports = router;
