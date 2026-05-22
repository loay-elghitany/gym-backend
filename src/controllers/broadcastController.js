const Broadcast = require("../models/Broadcast");

exports.getActiveBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: broadcasts,
    });
  } catch (error) {
    console.error("Broadcast controller error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load broadcasts",
      error: error.message,
    });
  }
};
