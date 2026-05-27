const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "Gym ID is required"],
      index: true,
    },
    gymSlug: {
      type: String,
      required: [true, "Gym slug is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Converted", "Lost"],
      default: "New",
    },
    notes: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
      default: "landing_page",
    },
    convertedToMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    contactedAt: {
      type: Date,
    },
    convertedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "leads",
  }
);

// Index for faster queries
leadSchema.index({ gymId: 1, status: 1 });
leadSchema.index({ gymSlug: 1, createdAt: -1 });

module.exports = mongoose.model("Lead", leadSchema);
