const mongoose = require("mongoose");
const InBodyRecord = require("../models/InBodyRecord");
const User = require("../models/User");

exports.getInBodyRecords = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    const member = await User.findOne({
      _id: memberId,
      tenantId: req.tenant._id,
      role: "member",
    }).select("name email role");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const records = await InBodyRecord.find({
      memberId: member._id,
      tenantId: req.tenant._id,
    })
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        member,
        records,
        latestRecord: records[0] || null,
      },
    });
  } catch (error) {
    console.error("GetInBodyRecords Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching InBody records",
      error: error.message,
    });
  }
};

exports.createInBodyRecord = async (req, res) => {
  try {
    const {
      memberId,
      weight,
      skeletalMuscleMass,
      bodyFatMass,
      bodyFatPercentage,
      bmi,
      bmr,
      visceralFatLevel,
      date,
    } = req.body;

    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    const member = await User.findOne({
      _id: memberId,
      tenantId: req.tenant._id,
      role: "member",
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const newRecord = await InBodyRecord.create({
      memberId: member._id,
      tenantId: req.tenant._id,
      weight: Number(weight) || 0,
      skeletalMuscleMass: Number(skeletalMuscleMass) || 0,
      bodyFatMass: Number(bodyFatMass) || 0,
      bodyFatPercentage: Number(bodyFatPercentage) || 0,
      bmi: Number(bmi) || 0,
      bmr: Number(bmr) || 0,
      visceralFatLevel: Number(visceralFatLevel) || 0,
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: "InBody record saved",
      data: newRecord,
    });
  } catch (error) {
    console.error("CreateInBodyRecord Error:", error);
    res.status(500).json({
      success: false,
      message: "Error saving InBody record",
      error: error.message,
    });
  }
};
