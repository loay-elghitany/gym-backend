const express = require("express");
const {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../controllers/trainerTemplateController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.get("/", authorize("trainer", "gymowner", "superadmin"), listTemplates);
router.get(
  "/:id",
  authorize("trainer", "gymowner", "superadmin"),
  getTemplateById,
);
router.post(
  "/",
  authorize("trainer", "gymowner", "superadmin"),
  createTemplate,
);
router.put(
  "/:id",
  authorize("trainer", "gymowner", "superadmin"),
  updateTemplate,
);
router.delete(
  "/:id",
  authorize("trainer", "gymowner", "superadmin"),
  deleteTemplate,
);

module.exports = router;
