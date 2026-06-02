const GymClass = require("../models/GymClass");
const User = require("../models/User");
const { awardPoints } = require("../services/gamificationService");

exports.createClass = async (req, res) => {
  try {
    const { title, description, startTime, endTime, capacity, trainerId } =
      req.body;

    if (!title || !startTime || !endTime || !capacity) {
      return res.status(400).json({
        success: false,
        message: "Title, start time, end time, and capacity are required.",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format for start or end time.",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    let assignedTrainerId;

    if (req.user.role === "trainer") {
      assignedTrainerId = req.user._id;
    } else if (req.user.role === "gymowner" || req.user.role === "superadmin") {
      if (!trainerId) {
        return res.status(400).json({
          success: false,
          message:
            "Trainer selection is required when creating a class as a gym owner.",
        });
      }

      const trainer = await User.findOne({
        _id: trainerId,
        tenantId: req.tenant._id,
        role: "trainer",
      });

      if (!trainer) {
        return res.status(400).json({
          success: false,
          message: "Selected trainer is invalid or not part of this gym.",
        });
      }

      assignedTrainerId = trainerId;
    } else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create a class.",
      });
    }

    const gymClass = await GymClass.create({
      title,
      description,
      startTime: start,
      endTime: end,
      capacity: Number(capacity),
      trainerId: assignedTrainerId,
      tenantId: req.tenant._id,
      enrolledMembers: [],
      attendanceRecord: [],
    });

    res.status(201).json({ success: true, data: gymClass });
  } catch (error) {
    console.error("CreateClass Error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating class",
      error: error.message,
    });
  }
};

exports.getTenantClasses = async (req, res) => {
  try {
    const classes = await GymClass.find({ tenantId: req.tenant._id })
      .populate("trainerId", "name email")
      .populate("enrolledMembers", "name email role")
      .populate("attendanceRecord.memberId", "name email")
      .sort({ startTime: 1 });

    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    console.error("GetTenantClasses Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching classes",
      error: error.message,
    });
  }
};

exports.enrollSelf = async (req, res) => {
  try {
    const { classId } = req.params;

    const gymClass = await GymClass.findOne({
      _id: classId,
      tenantId: req.tenant._id,
    });

    if (!gymClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    if (gymClass.enrolledMembers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this class.",
      });
    }

    if (gymClass.enrolledMembers.length >= gymClass.capacity) {
      return res.status(400).json({
        success: false,
        message: "Class is full.",
      });
    }

    gymClass.enrolledMembers.push(req.user._id);
    gymClass.attendanceRecord.push({
      memberId: req.user._id,
      status: "absent",
    });
    await gymClass.save();

    const updatedClass = await GymClass.findById(classId)
      .populate("trainerId", "name email")
      .populate("enrolledMembers", "name email role")
      .populate("attendanceRecord.memberId", "name email");

    res.status(200).json({ success: true, data: updatedClass });
  } catch (error) {
    console.error("EnrollSelf Error:", error);
    res.status(500).json({
      success: false,
      message: "Error enrolling in class",
      error: error.message,
    });
  }
};

exports.cancelSelfEnrollment = async (req, res) => {
  try {
    const { classId } = req.params;

    const gymClass = await GymClass.findOne({
      _id: classId,
      tenantId: req.tenant._id,
    });

    if (!gymClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    if (!gymClass.enrolledMembers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You are not enrolled in this class.",
      });
    }

    gymClass.enrolledMembers = gymClass.enrolledMembers.filter(
      (memberId) => memberId.toString() !== req.user._id.toString(),
    );
    gymClass.attendanceRecord = gymClass.attendanceRecord.filter(
      (record) => record.memberId.toString() !== req.user._id.toString(),
    );

    await gymClass.save();

    const updatedClass = await GymClass.findById(classId)
      .populate("trainerId", "name email")
      .populate("enrolledMembers", "name email role")
      .populate("attendanceRecord.memberId", "name email");

    res.status(200).json({ success: true, data: updatedClass });
  } catch (error) {
    console.error("CancelSelfEnrollment Error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling enrollment",
      error: error.message,
    });
  }
};

exports.enrollMember = async (req, res) => {
  try {
    const { classId } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required to enroll.",
      });
    }

    const gymClass = await GymClass.findOne({
      _id: classId,
      tenantId: req.tenant._id,
    });

    if (!gymClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    if (gymClass.enrolledMembers.includes(memberId)) {
      return res.status(400).json({
        success: false,
        message: "Member is already enrolled in this class.",
      });
    }

    if (gymClass.enrolledMembers.length >= gymClass.capacity) {
      return res.status(400).json({
        success: false,
        message: "Class is fully booked.",
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
        message: "Member not found in this tenant.",
      });
    }

    gymClass.enrolledMembers.push(memberId);
    gymClass.attendanceRecord.push({ memberId, status: "absent" });
    await gymClass.save();

    const updatedClass = await GymClass.findById(classId)
      .populate("enrolledMembers", "name email role")
      .populate("attendanceRecord.memberId", "name email");

    res.status(200).json({ success: true, data: updatedClass });
  } catch (error) {
    console.error("EnrollMember Error:", error);
    res.status(500).json({
      success: false,
      message: "Error enrolling member",
      error: error.message,
    });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { memberId, status } = req.body;

    if (!memberId || !status) {
      return res.status(400).json({
        success: false,
        message: "Member ID and status are required.",
      });
    }

    if (!["present", "absent"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'present' or 'absent'.",
      });
    }

    const gymClass = await GymClass.findOne({
      _id: classId,
      tenantId: req.tenant._id,
    });

    if (!gymClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    if (!gymClass.enrolledMembers.includes(memberId)) {
      return res.status(400).json({
        success: false,
        message: "Member is not enrolled in this class.",
      });
    }

    const recordIndex = gymClass.attendanceRecord.findIndex((record) =>
      record.memberId.equals(memberId),
    );

    if (recordIndex === -1) {
      gymClass.attendanceRecord.push({
        memberId,
        status,
        updatedAt: new Date(),
      });
    } else {
      gymClass.attendanceRecord[recordIndex].status = status;
      gymClass.attendanceRecord[recordIndex].updatedAt = new Date();
    }

    await gymClass.save();

    if (status === "present") {
      await awardPoints(memberId, req.tenant._id, 15, "Class attendance");
    }

    const updatedClass = await GymClass.findById(classId)
      .populate("enrolledMembers", "name email role")
      .populate("attendanceRecord.memberId", "name email");

    res.status(200).json({ success: true, data: updatedClass });
  } catch (error) {
    console.error("MarkAttendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Error marking attendance",
      error: error.message,
    });
  }
};
