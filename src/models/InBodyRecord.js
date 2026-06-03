const mongoose = require("mongoose");

const inBodyRecordSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "MemberId is required"],
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "TenantId is required"],
      index: true,
    },
    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: 0,
    },
    skeletalMuscleMass: {
      type: Number,
      min: 0,
      default: 0,
    },
    bodyFatMass: {
      type: Number,
      min: 0,
      default: 0,
    },
    bodyFatPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    bmi: {
      type: Number,
      min: 0,
      default: 0,
    },
    bmr: {
      type: Number,
      min: 0,
      default: 0,
    },
    visceralFatLevel: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Optional scan image stored in Cloudinary
    scanImageUrl: {
      type: String,
      default: null,
    },
    // Make muscle mass more explicit in schema (keeps existing skeletalMuscleMass for compatibility)
    muscleMass: {
      type: Number,
      min: 0,
      default: 0,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "inbodyrecords",
  },
);

inBodyRecordSchema.index({ memberId: 1, tenantId: 1, date: -1 });

module.exports = mongoose.model("InBodyRecord", inBodyRecordSchema);
