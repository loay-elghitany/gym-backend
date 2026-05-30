const express = require("express");
const {
  getLandingPageData,
  updateLandingConfig,
  getLandingTrainers,
} = require("../controllers/landingPageController");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const publicLandingRouter = express.Router();
const protectedLandingRouter = express.Router();

publicLandingRouter.get("/:subdomain", getLandingPageData);
publicLandingRouter.get("/:subdomain/trainers", getLandingTrainers);

protectedLandingRouter.put(
  "/landing-config",
  tenantMiddleware,
  authMiddleware,
  authorize("gymowner"),
  updateLandingConfig,
);

module.exports = {
  publicLandingRouter,
  protectedLandingRouter,
};
