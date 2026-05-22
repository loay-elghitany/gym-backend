const User = require("../models/User");

const RANKS = [
  { name: "Bronze", min: 0, max: 500 },
  { name: "Silver", min: 501, max: 1500 },
  { name: "Gold", min: 1501, max: Number.MAX_SAFE_INTEGER },
];

const getRankFromPoints = (points = 0) => {
  const numericPoints = Number(points) || 0;
  const rank = RANKS.find(
    (item) => numericPoints >= item.min && numericPoints <= item.max,
  );
  return rank ? rank.name : "Bronze";
};

const addBadge = (user, badge) => {
  if (!user.gamification) {
    user.gamification = {};
  }
  if (!Array.isArray(user.gamification.badges)) {
    user.gamification.badges = [];
  }
  const exists = user.gamification.badges.some(
    (item) => item.name === badge.name,
  );
  if (!exists) {
    user.gamification.badges.push({
      name: badge.name,
      description: badge.description,
      awardedAt: badge.awardedAt || new Date(),
    });
  }
};

const awardPoints = async (
  memberId,
  tenantId,
  points,
  reason = "",
  extra = {},
) => {
  if (!memberId || !tenantId) {
    throw new Error("memberId and tenantId are required to award points");
  }

  const user = await User.findOne({ _id: memberId, tenantId });
  if (!user) {
    throw new Error("User not found for gamification update");
  }

  user.gamification = user.gamification || {};
  user.gamification.points =
    Number(user.gamification.points || 0) + Number(points);

  if (typeof extra.attendanceStreak === "number") {
    user.gamification.attendanceStreak = extra.attendanceStreak;
  }

  user.gamification.rank = getRankFromPoints(user.gamification.points);

  if ((user.gamification.attendanceStreak || 0) >= 7) {
    addBadge(user, {
      name: "7-Day Streak",
      description: "Completed seven consecutive gym attendance days.",
      awardedAt: new Date(),
    });
  }

  if (user.gamification.points >= 1501) {
    addBadge(user, {
      name: "Elite Performer",
      description: "Surpassed 1,500 gamification points.",
      awardedAt: new Date(),
    });
  }

  await user.save();
  return user;
};

const getLeaderboard = async (tenantId, limit = 20) => {
  if (!tenantId) {
    throw new Error("tenantId is required for leaderboard queries");
  }

  const users = await User.find({ tenantId, role: "member" })
    .sort({ "gamification.points": -1, name: 1 })
    .limit(Number(limit))
    .select("name email gamification");

  return users.map((user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    points: Number(user.gamification?.points || 0),
    rank:
      user.gamification?.rank || getRankFromPoints(user.gamification?.points),
    badges: user.gamification?.badges || [],
  }));
};

module.exports = {
  awardPoints,
  getRankFromPoints,
  getLeaderboard,
};
