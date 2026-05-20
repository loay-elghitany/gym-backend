const express = require("express");
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../controllers/smartTemplateController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAllTemplates);
router.get("/:id", getTemplateById);
router.post("/", authorize("gymowner", "superadmin"), createTemplate);
router.put("/:id", authorize("gymowner", "superadmin"), updateTemplate);
router.delete("/:id", authorize("gymowner", "superadmin"), deleteTemplate);

module.exports = router;
