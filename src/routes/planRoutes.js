const express = require("express");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");
const {
  getPlans,
  getPlanById,
  createPlan,
} = require("../controllers/planController");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/plans - members get assigned, trainers/owners get tenant list
router.get("/", getPlans);

// GET /api/plans/:id - view a specific plan
router.get("/:id", getPlanById);

// POST /api/plans - create new plan (trainer or gymowner)
router.post("/", authorize("trainer", "gymowner", "superadmin"), createPlan);

module.exports = router;
