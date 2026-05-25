const mongoose = require("mongoose");

const globalFoodSchema = new mongoose.Schema(
  {
    nameEn: { type: String, trim: true, required: true },
    nameAr: { type: String, trim: true, required: true },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    baseUnit: { type: String, trim: true, default: "100g" },
  },
  {
    timestamps: true,
    collection: "globalfoods",
  },
);

globalFoodSchema.index({ nameEn: 1, nameAr: 1 });

module.exports = mongoose.model("GlobalFood", globalFoodSchema);
