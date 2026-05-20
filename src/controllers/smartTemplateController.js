const SmartTemplate = require("../models/SmartTemplate");

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await SmartTemplate.find({
      tenantSlug: req.tenant.slug,
      isActive: true,
    });
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error("GetAllTemplates Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching templates",
        error: error.message,
      });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const template = await SmartTemplate.findOne({
      _id: req.params.id,
      tenantSlug: req.tenant.slug,
    });

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    }

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error("GetTemplateById Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching template",
        error: error.message,
      });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { title, type, description, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Title and content are required" });
    }

    const template = await SmartTemplate.create({
      title,
      type: type || "workout",
      description: description || "",
      content,
      tenantId: req.tenant._id,
      tenantSlug: req.tenant.slug,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Smart template created",
        data: template,
      });
  } catch (error) {
    console.error("CreateTemplate Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error creating template",
        error: error.message,
      });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id,
    };

    const template = await SmartTemplate.findOneAndUpdate(
      { _id: req.params.id, tenantSlug: req.tenant.slug },
      updateData,
      { new: true, runValidators: true },
    );

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Smart template updated",
        data: template,
      });
  } catch (error) {
    console.error("UpdateTemplate Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error updating template",
        error: error.message,
      });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await SmartTemplate.findOneAndUpdate(
      { _id: req.params.id, tenantSlug: req.tenant.slug },
      { isActive: false, updatedBy: req.user._id },
      { new: true },
    );

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Smart template deactivated" });
  } catch (error) {
    console.error("DeleteTemplate Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting template",
        error: error.message,
      });
  }
};
