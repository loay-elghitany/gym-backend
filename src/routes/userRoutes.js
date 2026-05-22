const express = require("express");
const {
  getAllUsers,
  getUserById,
  getTelegramStatus,
  disconnectTelegram,
  createUser,
  updateUser,
  deleteUser,
  updateHealthProfile,
} = require("../controllers/userController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Telegram notification status for current user
router.get("/telegram-status", getTelegramStatus);
router.post("/telegram-disconnect", disconnectTelegram);

// Get all users in tenant
router.get("/", getAllUsers);

// Get specific user
router.get("/:id", getUserById);

// Create new user (GymOwner only)
router.post("/", authorize("gymowner", "superadmin"), createUser);

// Update user (GymOwner only)
router.put("/:id", authorize("gymowner", "superadmin"), updateUser);

// Update health profile (Trainer, GymOwner, Member self)
router.put(
  "/:id/health-profile",
  authorize("trainer", "gymowner", "member", "superadmin"),
  updateHealthProfile,
);

// Delete user (GymOwner only)
router.delete("/:id", authorize("gymowner", "superadmin"), deleteUser);

module.exports = router;
