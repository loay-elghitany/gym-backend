const mongoose = require("mongoose");

const smartTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Template title is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["workout", "nutrition", "wellness", "marketing"],
      default: "workout",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    content: {
      type: String,
      required: [true, "Template content is required"],
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    tenantSlug: {
      type: String,
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "smarttemplates",
  },
);

module.exports = mongoose.model("SmartTemplate", smartTemplateSchema);
