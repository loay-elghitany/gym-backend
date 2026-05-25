const mongoose = require("mongoose");
const PlanTemplate = require("../models/PlanTemplate");

const normalizeExercises = (exercises) => {
  if (!Array.isArray(exercises)) {
    return undefined;
  }

  return exercises
    .map((exercise) => ({
      name: String(exercise.name || "").trim(),
      sets: Number(exercise.sets) || 0,
      reps: String(exercise.reps || "").trim(),
      notes: String(exercise.notes || "").trim(),
      gifUrl: String(exercise.gifUrl || "").trim(),
    }))
    .filter((exercise) => exercise.name !== "");
};

const normalizeMeals = (meals) => {
  if (!Array.isArray(meals)) {
    return undefined;
  }

  return meals
    .map((meal) => ({
      mealName: String(meal.mealName || meal || "").trim(),
      description: String(meal.description || "").trim(),
    }))
    .filter((meal) => meal.mealName !== "");
};

exports.listTemplates = async (req, res) => {
  try {
    const templates = await PlanTemplate.find({
      tenantId: req.tenant._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error("ListPlanTemplates Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching plan templates",
      error: error.message,
    });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const templateId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID",
      });
    }

    const template = await PlanTemplate.findOne({
      _id: templateId,
      tenantId: req.tenant._id,
      isActive: true,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error("GetPlanTemplate Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching template",
      error: error.message,
    });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { templateName, exercises, meals } = req.body;

    if (!templateName || typeof templateName !== "string") {
      return res.status(400).json({
        success: false,
        message: "Template name is required",
      });
    }

    const normalizedExercises = normalizeExercises(exercises) || [];
    const normalizedMeals = normalizeMeals(meals) || [];

    const template = await PlanTemplate.create({
      templateName: templateName.trim(),
      exercises: normalizedExercises,
      meals: normalizedMeals,
      tenantId: req.tenant._id,
      tenantSlug: req.tenant.slug,
      createdByTrainerId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Template saved successfully",
      data: template,
    });
  } catch (error) {
    console.error("CreatePlanTemplate Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error saving template",
      error: error.message,
    });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const templateId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID",
      });
    }

    const updateData = {};

    if (typeof req.body.templateName === "string") {
      updateData.templateName = req.body.templateName.trim();
    }

    const normalizedExercises = normalizeExercises(req.body.exercises);
    if (Object.prototype.hasOwnProperty.call(req.body, "exercises")) {
      updateData.exercises = normalizedExercises;
    }

    const normalizedMeals = normalizeMeals(req.body.meals);
    if (Object.prototype.hasOwnProperty.call(req.body, "meals")) {
      updateData.meals = normalizedMeals;
    }

    const template = await PlanTemplate.findOneAndUpdate(
      { _id: templateId, tenantId: req.tenant._id, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    console.error("UpdatePlanTemplate Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating template",
      error: error.message,
    });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const templateId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID",
      });
    }

    const template = await PlanTemplate.findOneAndUpdate(
      { _id: templateId, tenantId: req.tenant._id, isActive: true },
      { isActive: false },
      { new: true },
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("DeletePlanTemplate Error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting template",
      error: error.message,
    });
  }
};
