const express = require("express");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");
const {
  getGyms,
  getGymById,
  createGym,
  updateGym,
  updateGymStatus,
  updateGymQuota,
  createSuperAdmin,
  getPlans,
  createPlan,
  updatePlan,
  getBroadcasts,
  createBroadcast,
  getAuditLogs,
  deleteGym,
  createGymOwner,
} = require("../controllers/superAdminController");

const router = express.Router();

router.post("/setup", createSuperAdmin);
router.use(authMiddleware, authorize("superadmin"));

router.get("/gyms", getGyms);
router.get("/gyms/:id", getGymById);
router.post("/gyms", createGym);
router.put("/gyms/:id", updateGym);
router.put("/gyms/:id/status", updateGymStatus);
router.put("/gyms/:id/quota", updateGymQuota);
router.post("/gyms/:id/owner", createGymOwner);
router.delete("/gyms/:id", deleteGym);

router.get("/plans", getPlans);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);

router.get("/broadcasts", getBroadcasts);
router.post("/broadcasts", createBroadcast);

router.get("/audit-logs", getAuditLogs);

module.exports = router;
