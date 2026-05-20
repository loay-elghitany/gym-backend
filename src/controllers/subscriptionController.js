const User = require("../models/User");

exports.freezeSubscription = async (req, res) => {
  try {
    if (req.user.role !== "member") {
      return res.status(403).json({
        success: false,
        message: "Only members can freeze their own subscription",
      });
    }

    const days = Math.min(Math.max(Number(req.body.days) || 1, 1), 7);
    const user = await User.findOne({
      _id: req.user._id,
      tenantId: req.tenant._id,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.subscription || user.subscription.status === "expired") {
      return res.status(400).json({
        success: false,
        message: "Only active subscriptions can be frozen",
      });
    }

    const now = new Date();
    if (user.subscription.frozenUntil && user.subscription.frozenUntil > now) {
      return res.status(400).json({
        success: false,
        message: "Your subscription is already frozen",
      });
    }

    const frozenUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    user.subscription.status = "paused";
    user.subscription.frozenUntil = frozenUntil;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Membership frozen successfully",
      data: {
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error("FreezeSubscription Error:", error);
    res.status(500).json({
      success: false,
      message: "Error freezing subscription",
      error: error.message,
    });
  }
};
