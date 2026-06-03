const mongoose = require("mongoose");
const InBodyRecord = require("../models/InBodyRecord");
const User = require("../models/User");

// Delete a member's progress photo (trainer action)
exports.deleteMemberProgressPhoto = async (req, res) => {
  try {
    const { memberId, photoId } = req.params;
    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid member ID" });
    }
    if (!photoId) {
      return res.status(400).json({ success: false, message: "Photo ID required" });
    }

    const user = await User.findOneAndUpdate(
      { _id: memberId, tenantId: req.tenant._id },
      { $pull: { progressPhotos: { _id: photoId } } },
      { new: true }
    ).select("progressPhotos");

    if (!user) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    res.status(200).json({ success: true, message: "Photo deleted", data: user.progressPhotos });
  } catch (error) {
    console.error("DeleteMemberProgressPhoto Error:", error);
    res.status(500).json({ success: false, message: "Error deleting photo", error: error.message });
  }
};

// Delete an inbody record for a member (trainer action) - handles both member-embedded and trainer-created docs
exports.deleteMemberInBodyRecord = async (req, res) => {
  try {
    const { memberId, recordId } = req.params;
    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid member ID" });
    }
    if (!recordId) {
      return res.status(400).json({ success: false, message: "Record ID required" });
    }

    // Try pulling from user's embedded inBodyRecords first
    const user = await User.findOneAndUpdate(
      { _id: memberId, tenantId: req.tenant._id },
      { $pull: { inBodyRecords: { _id: recordId } } },
      { new: true }
    ).select("inBodyRecords");

    if (user && user.inBodyRecords) {
      // If the pull succeeded and record is gone, return updated list
      return res.status(200).json({ success: true, message: "Member inBody record deleted", data: user.inBodyRecords });
    }

    // Fallback: try deleting from InBodyRecord collection (trainer-created)
    const deleted = await InBodyRecord.findOneAndDelete({ _id: recordId, memberId, tenantId: req.tenant._id });
    if (deleted) {
      return res.status(200).json({ success: true, message: "Trainer inBody record deleted", data: deleted });
    }

    res.status(404).json({ success: false, message: "Record not found" });
  } catch (error) {
    console.error("DeleteMemberInBodyRecord Error:", error);
    res.status(500).json({ success: false, message: "Error deleting record", error: error.message });
  }
};

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
    }).select("name email role inBodyRecords progressPhotos");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Fetch trainer-added records from InBodyRecord collection
    const trainerRecords = await InBodyRecord.find({
      memberId: member._id,
      tenantId: req.tenant._id,
    })
      .sort({ date: -1 })
      .lean();

    // Transform trainer records to include source field
    const trainerRecordsWithSource = trainerRecords.map((record) => ({
      ...record,
      source: "trainer",
      uploadedBy: "trainer",
    }));

    // Transform member-uploaded records to match trainer record structure
    const memberRecordsWithSource = (member.inBodyRecords || []).map(
      (record) => ({
        _id: record._id,
        memberId: member._id,
        weight: record.weight || 0,
        skeletalMuscleMass: record.muscleMass || 0,
        bodyFatMass: 0, // Not available in member uploads
        bodyFatPercentage: record.fatPercentage || 0,
        bmi: 0, // Not available in member uploads
        bmr: 0, // Not available in member uploads
        visceralFatLevel: 0, // Not available in member uploads
        date: record.date,
        source: "member",
        uploadedBy: "member",
        fileUrl: record.fileUrl || null,
      }),
    );

    // Combine and sort by date (newest first)
    const combinedRecords = [
      ...trainerRecordsWithSource,
      ...memberRecordsWithSource,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: {
        member,
        records: combinedRecords,
        latestRecord: combinedRecords[0] || null,
        progressPhotos: member.progressPhotos || [],
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
