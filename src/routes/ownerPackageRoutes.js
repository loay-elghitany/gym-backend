const express = require("express");
const {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} = require("../controllers/membershipPackageController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", authorize("gymowner", "superadmin"), getAllPackages);
router.get("/:id", authorize("gymowner", "superadmin"), getPackageById);
router.post("/", authorize("gymowner", "superadmin"), createPackage);
router.put("/:id", authorize("gymowner", "superadmin"), updatePackage);
router.delete("/:id", authorize("gymowner", "superadmin"), deletePackage);

module.exports = router;
