const User = require("../models/User");

const getBillingWindow = (req) => {
  const now = new Date();
  const startDate = req.query?.startDate
    ? new Date(req.query.startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = req.query?.endDate
    ? new Date(req.query.endDate)
    : new Date(now.getFullYear(), now.getMonth() + 1, 1);

  if (Number.isNaN(startDate.getTime())) {
    startDate.setTime(new Date(now.getFullYear(), now.getMonth(), 1).getTime());
  }
  if (Number.isNaN(endDate.getTime())) {
    endDate.setTime(
      new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime(),
    );
  }

  return { startDate, endDate };
};

exports.getForecast = async (req, res, next) => {
  try {
    const tenantId = req.tenant?._id;
    const { startDate } = getBillingWindow(req);

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

    const now = new Date();
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);

    const expiringUsers = await User.aggregate([
      {
        $match: {
          tenantId,
          "subscription.status": "active",
          "subscription.expiresAt": { $gte: now, $lte: in30 },
        },
      },
      {
        $lookup: {
          from: "membershippackages",
          localField: "subscription.packageId",
          foreignField: "_id",
          as: "package",
        },
      },
      { $unwind: { path: "$package", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          resolvedPrice: {
            $cond: [
              {
                $gt: [{ $ifNull: ["$subscription.price", 0] }, 0],
              },
              "$subscription.price",
              { $ifNull: ["$package.price", 0] },
            ],
          },
        },
      },
    ]);

    const expectedRenewals = expiringUsers.reduce(
      (sum, user) => sum + Number(user.resolvedPrice || 0) * renewalRate,
      0,
    );

    const daily = Array.from({ length: 30 }).map((_, index) => {
      const day = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
      return {
        date: day.toISOString().slice(0, 10),
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
    const billingWindow = getBillingWindow(req);
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
          "subscription.expiresAt": { $gt: billingWindow.startDate },
          $or: [
            { "subscription.startDate": { $exists: false } },
            { "subscription.startDate": { $lte: billingWindow.endDate } },
          ],
        },
      },
      {
        $lookup: {
          from: "membershippackages",
          localField: "subscription.packageId",
          foreignField: "_id",
          as: "package",
        },
      },
      { $unwind: { path: "$package", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          revenueAmount: {
            $cond: [
              {
                $gt: [{ $ifNull: ["$subscription.price", 0] }, 0],
              },
              "$subscription.price",
              { $ifNull: ["$package.price", 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$revenueAmount" },
        },
      },
    ]);

    const monthlyRevenue =
      Math.round((revenueData[0]?.revenue || 0) * 100) / 100;
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

    const newTraineesThisMonth = await User.countDocuments({
      tenantId: req.tenant._id,
      role: "member",
      createdAt: { $gte: billingWindow.startDate },
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
        newTraineesThisMonth,
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
