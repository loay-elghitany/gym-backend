const express = require("express");
const {
  createLead,
  getLeads,
  updateLeadStatus,
  getLeadStats,
} = require("../controllers/leadController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");

const publicLeadRouter = express.Router();
const protectedLeadRouter = express.Router();

// Public route: Create lead from landing page
publicLeadRouter.post("/:subdomain/leads", createLead);

// Protected routes for gym owners
protectedLeadRouter.get(
  "/leads",
  tenantMiddleware,
  authMiddleware,
  authorize("gymowner"),
  getLeads
);

protectedLeadRouter.get(
  "/leads/stats",
  tenantMiddleware,
  authMiddleware,
  authorize("gymowner"),
  getLeadStats
);

protectedLeadRouter.patch(
  "/leads/:id/status",
  tenantMiddleware,
  authMiddleware,
  authorize("gymowner"),
  updateLeadStatus
);

module.exports = {
  publicLeadRouter,
  protectedLeadRouter,
};
