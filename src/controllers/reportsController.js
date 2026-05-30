const mongoose = require("mongoose");
const User = require("../models/User");

const getFirstDayOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

exports.getGymReports = async (req, res, next) => {
  try {
    const tenantId = req.tenant?._id;
    const now = new Date();

    // activeMembers: members with active subscription and expiresAt > now
    const activeMembers = await User.countDocuments({
      tenantId,
      role: "member",
      "subscription.status": "active",
      "subscription.expiresAt": { $gt: now },
    });

    // new trainees this month
    const monthStart = getFirstDayOfMonth(now);
    const newTraineesThisMonth = await User.countDocuments({
      tenantId,
      role: "member",
      createdAt: { $gte: monthStart },
    });

    // expiringSoon: expires within next 7 days
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon = await User.countDocuments({
      tenantId,
      role: "member",
      "subscription.status": "active",
      "subscription.expiresAt": { $gte: now, $lte: in7 },
    });

    // growthChartData: last 6 months signups per month
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const growthAgg = await User.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          role: "member",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          signups: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Build last 6 months array
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      months.push({
        date: d,
        key,
        label: d.toLocaleString("en-US", { month: "short" }),
        signups: 0,
      });
    }

    growthAgg.forEach((g) => {
      const key = `${g._id.year}-${g._id.month}`;
      const m = months.find((mm) => mm.key === key);
      if (m) m.signups = g.signups;
    });

    const growthChartData = months.map((m) => ({
      month: m.label,
      signups: m.signups,
    }));

    // recentActivity: 5 most recent registered or subscription activity
    const recentAgg = await User.aggregate([
      {
        $match: { tenantId: new mongoose.Types.ObjectId(tenantId), role: "member" },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          subscription: 1,
          lastActivity: {
            $max: [
              "$createdAt",
              "$subscription.startDate",
              "$subscription.expiresAt",
            ],
          },
          status: {
            $cond: [
              {
                $and: [
                  { $eq: ["$subscription.status", "active"] },
                  { $gt: ["$subscription.expiresAt", now] },
                ],
              },
              "active",
              "inactive",
            ],
          },
        },
      },
      { $sort: { lastActivity: -1 } },
      { $limit: 5 },
    ]);

    const recentActivity = recentAgg.map((r) => ({
      name: r.name,
      date: r.lastActivity,
      status: r.status,
    }));

    // monthlyRevenue: attempt to compute, but only if package pricing exists
    let monthlyRevenue = null;
    try {
      const revenueData = await User.aggregate([
        {
          $match: {
            tenantId: new mongoose.Types.ObjectId(tenantId),
            role: "member",
            "subscription.status": "active",
            "subscription.expiresAt": { $gt: monthStart },
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
                { $gt: [{ $ifNull: ["$subscription.price", 0] }, 0] },
                "$subscription.price",
                { $ifNull: ["$package.price", 0] },
              ],
            },
          },
        },
        { $group: { _id: null, revenue: { $sum: "$revenueAmount" } } },
      ]);
      monthlyRevenue = Math.round((revenueData[0]?.revenue || 0) * 100) / 100;
    } catch (err) {
      // If lookup fails (no membershippackages collection), omit revenue.
      monthlyRevenue = null;
    }

    res.json({
      success: true,
      data: {
        activeMembers,
        newTraineesThisMonth,
        expiringSoon,
        monthlyRevenue,
        growthChartData,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};
