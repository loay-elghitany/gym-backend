const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { freezeSubscription } = require("../controllers/subscriptionController");

const router = express.Router();
router.use(authMiddleware);

router.post("/freeze", freezeSubscription);

module.exports = router;
