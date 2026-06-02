const Tenant = require("../models/Tenant");
const MembershipPackage = require("../models/MembershipPackage");

const DEFAULT_LANDING_CONFIG = {
  heroTitle: "",
  heroSubtitle: "",
  aboutText: "",
  themeColor: "#2563eb",
  logoUrl: "",
  coverUrl: "",
  galleryUrls: [],
  trainers: [],
  facebookUrl: "",
  instagramUrl: "",
  whatsappNumber: "",
  isActive: false,
};

const normalizeTrainer = (trainer = {}) => ({
  id: typeof trainer.id === "string" ? trainer.id.trim() : "",
  name: typeof trainer.name === "string" ? trainer.name.trim() : "",
  specialty:
    typeof trainer.specialty === "string" ? trainer.specialty.trim() : "",
  bio: typeof trainer.bio === "string" ? trainer.bio.trim() : "",
  imageUrl: typeof trainer.imageUrl === "string" ? trainer.imageUrl.trim() : "",
});

const normalizeLandingConfig = (config = {}) => ({
  heroTitle:
    typeof config.heroTitle === "string" ? config.heroTitle.trim() : "",
  heroSubtitle:
    typeof config.heroSubtitle === "string" ? config.heroSubtitle.trim() : "",
  aboutText:
    typeof config.aboutText === "string" ? config.aboutText.trim() : "",
  themeColor:
    typeof config.themeColor === "string" && config.themeColor.trim()
      ? config.themeColor.trim()
      : DEFAULT_LANDING_CONFIG.themeColor,
  logoUrl: typeof config.logoUrl === "string" ? config.logoUrl.trim() : "",
  coverUrl: typeof config.coverUrl === "string" ? config.coverUrl.trim() : "",
  galleryUrls: Array.isArray(config.galleryUrls)
    ? config.galleryUrls
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter(Boolean)
    : [],
  trainers: Array.isArray(config.trainers)
    ? config.trainers
        .map((trainer) => normalizeTrainer(trainer))
        .filter((t) => t.name)
    : [],
  facebookUrl:
    typeof config.facebookUrl === "string" ? config.facebookUrl.trim() : "",
  instagramUrl:
    typeof config.instagramUrl === "string" ? config.instagramUrl.trim() : "",
  whatsappNumber:
    typeof config.whatsappNumber === "string"
      ? config.whatsappNumber.trim()
      : "",
  isActive: Boolean(config.isActive),
});

const serializePublicPlan = (plan) => ({
  _id: plan._id,
  name: plan.name,
  price: Number(plan.price) || 0,
  durationInDays: Number(plan.durationInDays) || 0,
  sessionCount:
    plan.sessionCount === null || plan.sessionCount === undefined
      ? null
      : Number(plan.sessionCount),
});

exports.getLandingPageData = async (req, res) => {
  try {
    const subdomain = String(req.params.subdomain || "")
      .trim()
      .toLowerCase();

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: "A subdomain is required.",
      });
    }

    const tenant = await Tenant.findOne({ slug: subdomain }).lean();

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    const landingPageConfig = normalizeLandingConfig(tenant.landingPageConfig);
    const plans = await MembershipPackage.find({
      tenantSlug: subdomain,
      isActive: true,
    })
      .sort({ price: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        gymName: tenant.name,
        isActive: Boolean(landingPageConfig.isActive),
        landingPageConfig,
        plans: plans.map(serializePublicPlan),
      },
    });
  } catch (error) {
    console.error("GetLandingPageData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load landing page data.",
      error: error.message,
    });
  }
};

exports.getLandingTrainers = async (req, res) => {
  try {
    const subdomain = String(req.params.subdomain || "")
      .trim()
      .toLowerCase();

    if (!subdomain) {
      return res
        .status(400)
        .json({ success: false, message: "A subdomain is required." });
    }

    const tenant = await Tenant.findOne({ slug: subdomain }).lean();

    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, message: "Gym not found." });
    }

    // Fetch trainers for this tenant. `avatar` exists on User model; `bio`/`specialty` may be empty.
    const User = require("../models/User");
    const trainers = await User.find({
      tenantId: tenant._id,
      role: "trainer",
      isActive: true,
    })
      .select("name avatar bio specialty")
      .sort({ name: 1 })
      .lean();

    const payload = trainers.map((t) => ({
      _id: t._id,
      name: t.name || "",
      avatar: t.avatar || null,
      bio: t.bio || t.specialty || "",
    }));

    return res.status(200).json({ success: true, data: payload });
  } catch (error) {
    console.error("GetLandingTrainers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load trainers.",
      error: error.message,
    });
  }
};

exports.updateLandingConfig = async (req, res) => {
  try {
    const currentTenant = await Tenant.findById(req.tenant._id);

    if (!currentTenant) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    const currentConfig = normalizeLandingConfig(
      currentTenant.landingPageConfig,
    );

    // Explicitly extract trainers from req.body
    const trainersFromRequest = Array.isArray(req.body.trainers)
      ? req.body.trainers
          .map((trainer) => normalizeTrainer(trainer))
          .filter((t) => t.name)
      : [];

    const payload = {
      heroTitle:
        typeof req.body.heroTitle === "string"
          ? req.body.heroTitle.trim()
          : currentConfig.heroTitle,
      heroSubtitle:
        typeof req.body.heroSubtitle === "string"
          ? req.body.heroSubtitle.trim()
          : currentConfig.heroSubtitle,
      aboutText:
        typeof req.body.aboutText === "string"
          ? req.body.aboutText.trim()
          : currentConfig.aboutText,
      themeColor:
        typeof req.body.themeColor === "string" && req.body.themeColor.trim()
          ? req.body.themeColor.trim()
          : currentConfig.themeColor,
      logoUrl:
        typeof req.body.logoUrl === "string"
          ? req.body.logoUrl.trim()
          : currentConfig.logoUrl,
      coverUrl:
        typeof req.body.coverUrl === "string"
          ? req.body.coverUrl.trim()
          : currentConfig.coverUrl,
      galleryUrls: Array.isArray(req.body.galleryUrls)
        ? req.body.galleryUrls
            .map((url) => (typeof url === "string" ? url.trim() : ""))
            .filter(Boolean)
        : currentConfig.galleryUrls,
      trainers:
        trainersFromRequest.length > 0
          ? trainersFromRequest
          : currentConfig.trainers,
      facebookUrl:
        typeof req.body.facebookUrl === "string"
          ? req.body.facebookUrl.trim()
          : currentConfig.facebookUrl,
      instagramUrl:
        typeof req.body.instagramUrl === "string"
          ? req.body.instagramUrl.trim()
          : currentConfig.instagramUrl,
      whatsappNumber:
        typeof req.body.whatsappNumber === "string"
          ? req.body.whatsappNumber.trim()
          : currentConfig.whatsappNumber,
      isActive:
        req.body.isActive === undefined
          ? currentConfig.isActive
          : Boolean(req.body.isActive),
    };

    const landingPageConfig = normalizeLandingConfig(payload);

    // Explicitly update the landingPageConfig field on the tenant document
    currentTenant.landingPageConfig = landingPageConfig;

    // Save the document
    const updatedTenant = await currentTenant.save();

    if (!updatedTenant) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: normalizeLandingConfig(updatedTenant.landingPageConfig),
    });
  } catch (error) {
    console.error("UpdateLandingConfig Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update landing page configuration.",
      error: error.message,
    });
  }
};

exports.DEFAULT_LANDING_CONFIG = DEFAULT_LANDING_CONFIG;
