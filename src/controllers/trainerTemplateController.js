const mongoose = require("mongoose");
const PlanTemplate = require("../models/PlanTemplate");

const normalizeExerciseItem = (exercise) => {
  if (!exercise || typeof exercise !== "object") {
    return null;
  }

  const name = String(exercise.name || "").trim();
  if (!name) {
    return null;
  }

  return {
    name,
    sets:
      exercise.sets !== undefined && exercise.sets !== null
        ? Number(exercise.sets)
        : 0,
    reps: String(exercise.reps || "").trim(),
    notes: String(exercise.notes || "").trim(),
    gifUrl: String(exercise.gifUrl || "").trim(),
  };
};

const normalizeExercises = (exercises) => {
  if (!Array.isArray(exercises)) {
    return undefined;
  }

  return exercises.map(normalizeExerciseItem).filter(Boolean);
};

const normalizeDays = (days, fallbackExercises = []) => {
  const normalizedFallback = Array.isArray(fallbackExercises)
    ? fallbackExercises.map(normalizeExerciseItem).filter(Boolean)
    : [];

  if (Array.isArray(days) && days.length) {
    const normalized = days
      .map((day, index) => {
        if (!day || typeof day !== "object") {
          return null;
        }

        const dayName = String(day.dayName || "").trim() || `Day ${index + 1}`;
        const exercises = Array.isArray(day.exercises)
          ? day.exercises.map(normalizeExerciseItem).filter(Boolean)
          : [];

        return exercises.length ? { dayName, exercises } : null;
      })
      .filter(Boolean);

    return normalized.length
      ? normalized
      : normalizedFallback.length
        ? [{ dayName: "Day 1", exercises: normalizedFallback }]
        : [];
  }

  return normalizedFallback.length
    ? [{ dayName: "Day 1", exercises: normalizedFallback }]
    : [];
};

const flattenDays = (days) =>
  Array.isArray(days)
    ? days.flatMap((day) =>
        Array.isArray(day.exercises)
          ? day.exercises.map(normalizeExerciseItem).filter(Boolean)
          : [],
      )
    : [];

const normalizeTemplateResponse = (template) => {
  if (!template) {
    return template;
  }

  const rawTemplate =
    typeof template.toObject === "function" ? template.toObject() : template;
  const baseExercises = Array.isArray(rawTemplate.exercises)
    ? rawTemplate.exercises.map(normalizeExerciseItem).filter(Boolean)
    : [];
  const days = normalizeDays(rawTemplate.days, baseExercises);

  return {
    ...rawTemplate,
    days,
    exercises: baseExercises.length ? baseExercises : flattenDays(days),
  };
};

const normalizeFoodItem = (food) => {
  if (!food || typeof food !== "object") {
    return null;
  }

  const name = String(food.name || food.foodName || food.item || "").trim();
  if (!name) {
    return null;
  }

  return {
    name,
    quantity:
      food.quantity !== undefined && food.quantity !== null
        ? Number(food.quantity)
        : 0,
    calories:
      food.calories === undefined || food.calories === null
        ? null
        : Number(food.calories),
    protein:
      food.protein === undefined || food.protein === null
        ? null
        : Number(food.protein),
    carbs:
      food.carbs === undefined || food.carbs === null
        ? null
        : Number(food.carbs),
    fats:
      food.fats === undefined || food.fats === null ? null : Number(food.fats),
    baseUnit: String(food.baseUnit || "100g").trim() || "100g",
  };
};

const normalizeMeals = (meals) => {
  if (!Array.isArray(meals)) {
    return undefined;
  }

  return meals
    .map((meal) => {
      if (!meal || typeof meal !== "object") {
        return null;
      }

      const mealName = String(meal.mealName || meal.name || "").trim();
      if (!mealName) {
        return null;
      }

      const foods = Array.isArray(meal.foods)
        ? meal.foods.map(normalizeFoodItem).filter(Boolean)
        : [];

      return {
        mealName,
        foods,
      };
    })
    .filter((meal) => meal && meal.foods.length);
};

exports.listTemplates = async (req, res) => {
  try {
    const templates = await PlanTemplate.find({
      tenantId: req.tenant._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: templates.map(normalizeTemplateResponse),
    });
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

    res.status(200).json({
      success: true,
      data: normalizeTemplateResponse(template),
    });
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
    const { templateName, days, exercises, meals } = req.body;

    if (!templateName || typeof templateName !== "string") {
      return res.status(400).json({
        success: false,
        message: "Template name is required",
      });
    }

    const normalizedExercises = normalizeExercises(exercises) || [];
    const normalizedDays = normalizeDays(days, normalizedExercises);
    const normalizedMeals = normalizeMeals(meals) || [];

    const template = await PlanTemplate.create({
      templateName: templateName.trim(),
      exercises: normalizedDays.length
        ? flattenDays(normalizedDays)
        : normalizedExercises,
      days: normalizedDays,
      meals: normalizedMeals,
      tenantId: req.tenant._id,
      tenantSlug: req.tenant.slug,
      createdByTrainerId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Template saved successfully",
      data: normalizeTemplateResponse(template),
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
    const normalizedDays = normalizeDays(
      req.body.days,
      normalizedExercises || [],
    );

    if (Object.prototype.hasOwnProperty.call(req.body, "days")) {
      updateData.days = normalizedDays;
      updateData.exercises = flattenDays(normalizedDays);
    } else if (Object.prototype.hasOwnProperty.call(req.body, "exercises")) {
      updateData.exercises = normalizedExercises || [];
      updateData.days = normalizeDays(null, normalizedExercises || []);
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
      data: normalizeTemplateResponse(template),
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
