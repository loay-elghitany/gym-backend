const Membership = require("../models/Membership");
const User = require("../models/User");

// GET /api/analytics/forecast
exports.getForecast = async (req, res, next) => {
  try {
    const { tenantId } = req.tenant || {};

    // Historical renewal rate: fraction of users with subscriptions still active
    // among those who had an expiry in the past year. Simple approximation.
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const expiredWindow = await User.countDocuments({
      tenantId,
      "subscription.expiresAt": { $gte: oneYearAgo, $lte: new Date() },
    });

    const activeAfterExpiry = await User.countDocuments({
      tenantId,
      "subscription.expiresAt": { $gte: oneYearAgo, $lte: new Date() },
      "subscription.status": "active",
    });

    let renewalRate = 0.6;
    if (expiredWindow > 0) {
      renewalRate = Math.min(
        0.95,
        Math.max(0.2, activeAfterExpiry / expiredWindow),
      );
    }

    // Find members whose subscriptions expire in the next 30 days
    const now = new Date();
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);

    const expiringUsers = await User.find({
      tenantId,
      "subscription.expiresAt": { $gte: now, $lte: in30 },
      "subscription.status": "active",
    }).select("subscription.planId subscription.expiresAt");

    // Load membership prices for planIds
    const planIds = [
      ...new Set(expiringUsers.map((u) => String(u.subscription.planId))),
    ].filter(Boolean);
    const plans = await Membership.find({ _id: { $in: planIds } }).select(
      "price",
    );
    const priceMap = {};
    plans.forEach((p) => (priceMap[String(p._id)] = p.price || 0));

    // Expected revenue from renewals in next 30 days
    const expectedRenewals = expiringUsers.reduce((sum, u) => {
      const price = priceMap[String(u.subscription.planId)] || 0;
      return sum + price * renewalRate;
    }, 0);

    // Build a simple daily forecast (linearized by splitting equally across 30 days)
    const daily = Array.from({ length: 30 }).map((_, i) => {
      return {
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
          .toISOString()
          .slice(0, 10),
        expected: expectedRenewals / 30,
      };
    });

    res.json({ success: true, data: { expectedRenewals, renewalRate, daily } });
  } catch (err) {
    next(err);
  }
};

exports.getOwnerMetrics = async (req, res) => {
  try {
    const now = new Date();
    const memberFilter = {
      tenantId: req.tenant._id,
      role: "member",
      isActive: true,
    };

    const activeMembers = await User.countDocuments(memberFilter);
    const activeSubscriptions = await User.countDocuments({
      ...memberFilter,
      "subscription.status": "active",
      "subscription.expiresAt": { $gt: now },
    });
    const expiringSoon = await User.countDocuments({
      ...memberFilter,
      "subscription.expiresAt": {
        $gte: now,
        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      "subscription.status": "active",
    });

    const revenueData = await User.aggregate([
      {
        $match: {
          ...memberFilter,
          "subscription.status": "active",
          "subscription.expiresAt": { $gt: now },
          "subscription.planId": { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: "memberships",
          localField: "subscription.planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $ifNull: ["$plan.price", 0] } },
        },
      },
    ]);

    const monthlyRevenue = revenueData[0]?.revenue || 0;
    const netProfit = Math.round(monthlyRevenue * 0.72 * 100) / 100;
    const revenueComparison = activeMembers
      ? Math.round(((activeSubscriptions / activeMembers) * 100 - 65) * 10) / 10
      : 0;

    const churnRiskCount = await User.countDocuments({
      tenantId: req.tenant._id,
      role: "member",
      isActive: true,
      $or: [
        { lastAttendanceAt: null },
        {
          lastAttendanceAt: {
            $lt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        activeMembers,
        activeSubscriptions,
        monthlyRevenue,
        netProfit,
        revenueComparison,
        expiringSoon,
        churnRiskCount,
      },
    });
  } catch (error) {
    console.error("GetOwnerMetrics Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching owner metrics",
      error: error.message,
    });
  }
};
