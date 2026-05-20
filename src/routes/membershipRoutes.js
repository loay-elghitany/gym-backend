const express = require("express");
const {
  getAllMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
} = require("../controllers/membershipController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all membership plans (accessible to all authenticated users)
router.get("/", getAllMemberships);

// Get specific membership plan
router.get("/:id", getMembershipById);

// Create membership plan (GymOwner only)
router.post("/", authorize("gymowner", "superadmin"), createMembership);

// Update membership plan (GymOwner only)
router.put("/:id", authorize("gymowner", "superadmin"), updateMembership);

// Delete membership plan (GymOwner only)
router.delete("/:id", authorize("gymowner", "superadmin"), deleteMembership);

module.exports = router;
