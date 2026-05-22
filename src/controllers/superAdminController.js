const Tenant = require("../models/Tenant");
const User = require("../models/User");
const SaaSPlan = require("../models/SaaSPlan");
const Broadcast = require("../models/Broadcast");
const CheckIn = require("../models/CheckIn");
const WorkoutLog = require("../models/WorkoutLog");
const SmartTemplate = require("../models/SmartTemplate");
const Membership = require("../models/Membership");
const Plan = require("../models/Plan");
const Challenge = require("../models/Challenge");
const Wallet = require("../models/Wallet");
const { logAuditEvent } = require("../services/auditService");

exports.getGyms = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });

    const gyms = await Promise.all(
      tenants.map(async (tenant) => {
        const totalMembers = await User.countDocuments({
          tenantId: tenant._id,
          role: "member",
          isActive: true,
        });

        const owner = await User.findOne({
          tenantId: tenant._id,
          role: "gymowner",
        }).select("name email");

        return {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          ownerName: owner?.name || "N/A",
          ownerEmail: owner?.email || "N/A",
          planName: tenant.planName || "custom",
          subscriptionStatus: tenant.subscriptionStatus || "trial",
          maxMembers: tenant.maxMembers,
          maxTrainers: tenant.maxTrainers,
          status: tenant.status || "active",
          totalMembers,
          createdAt: tenant.createdAt,
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: gyms,
    });
  } catch (error) {
    console.error("SuperAdmin getGyms Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load tenant data",
      error: error.message,
    });
  }
};

exports.getGymById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id).populate("planId");

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    const totalMembers = await User.countDocuments({
      tenantId: tenant._id,
      role: "member",
      isActive: true,
    });

    const owner = await User.findOne({
      tenantId: tenant._id,
      role: "gymowner",
    }).select("name email");

    res.status(200).json({
      success: true,
      data: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        phone: tenant.phone,
        address: tenant.address,
        ownerName: owner?.name || "N/A",
        ownerEmail: owner?.email || "N/A",
        planId: tenant.planId,
        planName: tenant.planName,
        subscriptionStatus: tenant.subscriptionStatus,
        subscriptionPlan: tenant.subscriptionPlan,
        maxMembers: tenant.maxMembers,
        maxTrainers: tenant.maxTrainers,
        primaryColor: tenant.primaryColor,
        logoUrl: tenant.logoUrl,
        status: tenant.status,
        totalMembers,
        createdAt: tenant.createdAt,
      },
    });
  } catch (error) {
    console.error("SuperAdmin getGymById Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch gym details",
      error: error.message,
    });
  }
};

exports.createSuperAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide email and password for the super admin account",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingSuperadmin = await User.findOne({ role: "superadmin" });

    if (existingSuperadmin) {
      return res.status(409).json({
        success: false,
        message: "Super admin account already exists",
      });
    }

    let systemTenant = await Tenant.findOne({ slug: "system" });

    if (!systemTenant) {
      systemTenant = await Tenant.create({
        name: "System Tenant",
        slug: "system",
        email: "system@platform.local",
        phone: "",
        status: "active",
        isActive: true,
        maxMembers: 1,
        subscriptionStatus: "active",
        subscriptionPlan: "enterprise",
      });
    }

    const superAdmin = await User.create({
      name: name || "Platform Super Admin",
      email: normalizedEmail,
      password,
      role: "superadmin",
      tenantId: systemTenant._id,
      tenantSlug: systemTenant.slug,
      isActive: true,
      permissions: [
        "manage_tenant",
        "view_reports",
        "manage_members",
        "manage_trainers",
      ],
    });

    res.status(201).json({
      success: true,
      message: "Super admin account created successfully",
      data: {
        email: superAdmin.email,
      },
    });
  } catch (error) {
    console.error("SuperAdmin createSuperAdmin Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create super admin account",
      error: error.message,
    });
  }
};

exports.createGym = async (req, res) => {
  try {
    const { name, slug, email, ownerName, ownerPassword, phone, planId } =
      req.body;

    if (!name || !slug || !email || !ownerName || !ownerPassword || !planId) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide gym name, slug, owner email, owner name, password, and select a pricing plan",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingTenant = await Tenant.findOne({
      $or: [{ slug }, { email: normalizedEmail }],
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: "A gym with that slug or contact email already exists",
      });
    }

    let plan = null;
    if (planId) {
      plan = await SaaSPlan.findById(planId);
      if (!plan) {
        return res.status(400).json({
          success: false,
          message: "Selected plan does not exist",
        });
      }
    }

    const tenant = await Tenant.create({
      name,
      slug,
      email: normalizedEmail,
      phone,
      planId: plan._id,
      planName: plan.name,
      subscriptionStatus: "active",
      subscriptionPlan: plan.slug,
      maxMembers: plan.maxMembers,
      maxTrainers: plan.maxTrainers,
      status: "active",
    });

    const owner = await User.create({
      name: ownerName,
      email: normalizedEmail,
      password: ownerPassword,
      role: "gymowner",
      phone,
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
      permissions: ["manage_members", "manage_trainers", "manage_tenant"],
      isActive: true,
    });

    await logAuditEvent({
      action: "create_gym",
      actorId: req.user?._id,
      actorName: req.user?.name,
      targetId: tenant._id,
      targetType: "tenant",
      details: {
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.planName,
      },
    });

    res.status(201).json({
      success: true,
      message: "Gym and owner created successfully",
      data: {
        gym: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          planName: tenant.planName,
          maxMembers: tenant.maxMembers,
          status: tenant.status,
        },
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          role: owner.role,
        },
      },
    });
  } catch (error) {
    console.error("SuperAdmin createGym Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create gym",
      error: error.message,
    });
  }
};

exports.createGymOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required to create an owner",
      });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with that email already exists",
      });
    }

    const owner = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: "gymowner",
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
      isActive: true,
      permissions: ["manage_members", "manage_trainers", "manage_tenant"],
    });

    await logAuditEvent({
      action: "create_gym_owner",
      actorId: req.user?._id,
      actorName: req.user?.name,
      targetId: owner._id,
      targetType: "user",
      details: {
        name: owner.name,
        email: owner.email,
        tenantId: tenant._id,
      },
    });

    owner.password = undefined;
    res.status(201).json({
      success: true,
      message: "Gym owner created successfully",
      data: { owner },
    });
  } catch (error) {
    console.error("SuperAdmin createGymOwner Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create gym owner",
      error: error.message,
    });
  }
};

exports.updateGym = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      planId,
      primaryColor,
      logoUrl,
      maxMembers,
      status,
      subscriptionStatus,
    } = req.body;

    const updateData = {
      ...(name ? { name } : {}),
      ...(email ? { email: email.trim().toLowerCase() } : {}),
      ...(phone ? { phone } : {}),
      ...(primaryColor ? { primaryColor } : {}),
      ...(logoUrl ? { logoUrl } : {}),
      ...(typeof status === "string" ? { status } : {}),
      ...(typeof subscriptionStatus === "string" ? { subscriptionStatus } : {}),
    };

    if (planId) {
      const plan = await SaaSPlan.findById(planId);
      if (!plan) {
        return res.status(400).json({
          success: false,
          message: "Selected plan does not exist",
        });
      }
      updateData.planId = plan._id;
      updateData.planName = plan.name;
      updateData.subscriptionPlan = plan.slug;
      updateData.maxMembers = plan.maxMembers;
      updateData.maxTrainers = plan.maxTrainers;
    }

    if (maxMembers !== undefined) {
      const quota = Number(maxMembers);
      if (Number.isNaN(quota) || quota < 1) {
        return res.status(400).json({
          success: false,
          message: "maxMembers must be a positive number",
        });
      }
      updateData.maxMembers = quota;
    }

    const tenant = await Tenant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    await logAuditEvent({
      action: "update_gym",
      actorId: req.user?._id,
      actorName: req.user?.name,
      targetId: tenant._id,
      targetType: "tenant",
      details: {
        name: tenant.name,
        status: tenant.status,
        plan: tenant.planName,
      },
    });

    res.status(200).json({
      success: true,
      message: "Gym updated successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("SuperAdmin updateGym Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update gym",
      error: error.message,
    });
  }
};

exports.updateGymStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'active' or 'suspended'",
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    await logAuditEvent({
      action: "update_gym_status",
      actorId: req.user?._id,
      actorName: req.user?.name,
      targetId: tenant._id,
      targetType: "tenant",
      details: { status },
    });

    res.status(200).json({
      success: true,
      message: "Gym status updated",
      data: {
        id: tenant._id,
        status: tenant.status,
      },
    });
  } catch (error) {
    console.error("SuperAdmin updateGymStatus Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update gym status",
      error: error.message,
    });
  }
};

exports.updateGymQuota = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxMembers } = req.body;
    const quota = Number(maxMembers);

    if (Number.isNaN(quota) || quota < 1) {
      return res.status(400).json({
        success: false,
        message: "maxMembers must be a positive number",
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { maxMembers: quota },
      { new: true, runValidators: true },
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    await logAuditEvent({
      action: "update_gym_quota",
      actorId: req.user?._id,
      actorName: req.user?.name,
      targetId: tenant._id,
      targetType: "tenant",
      details: { maxMembers: String(quota) },
    });

    res.status(200).json({
      success: true,
      message: "Gym quota updated",
      data: {
        id: tenant._id,
        maxMembers: tenant.maxMembers,
      },
    });
  } catch (error) {
    console.error("SuperAdmin updateGymQuota Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update gym quota",
      error: error.message,
    });
  }
};

exports.deleteGym = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Gym id is required for deletion",
      });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "Gym not found" });
    }

    const gymId = tenant._id;

    // Remove tenant document
    await Tenant.deleteOne({ _id: gymId });

    // Cascade delete related collections by tenantId
    await Promise.all([
      User.deleteMany({ tenantId: gymId, role: { $ne: "superadmin" } }),
      CheckIn.deleteMany({ tenantId: gymId }),
      WorkoutLog.deleteMany({ tenantId: gymId }),
      SmartTemplate.deleteMany({ tenantId: gymId }),
      Membership.deleteMany({ tenantId: gymId }),
      Plan.deleteMany({ tenantId: gymId }),
      Challenge.deleteMany({ tenantId: gymId }),
      Wallet.deleteMany({ tenantId: gymId }),
    ]);

    await logAuditEvent({
      action: "delete_gym",
      actorId: req.user?._id,
      actorName: req.user?.name,
      targetId: tenant._id,
      targetType: "tenant",
      details: { name: tenant.name, slug: tenant.slug },
    });

    res
      .status(200)
      .json({ success: true, message: "Gym and related data deleted" });
  } catch (error) {
    console.error("SuperAdmin deleteGym Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to delete gym",
      error: error.message,
    });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const plans = await SaaSPlan.find().sort({ displayOrder: 1, price: 1 });

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("SuperAdmin getPlans Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load pricing plans",
      error: error.message,
    });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      currency,
      billingCycle,
      maxMembers,
      maxTrainers,
      features,
      isActive,
      displayOrder,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Plan name and slug are required",
      });
    }

    const existingPlan = await SaaSPlan.findOne({
      slug: slug.trim().toLowerCase(),
    });
    if (existingPlan) {
      return res.status(409).json({
        success: false,
        message: "A plan with that slug already exists",
      });
    }

    const plan = await SaaSPlan.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description || "",
      price: Number(price) || 0,
      currency: currency?.trim() || "USD",
      billingCycle: billingCycle || "monthly",
      maxMembers: Number(maxMembers) || 100,
      maxTrainers: Number(maxTrainers) || 10,
      features: Array.isArray(features) ? features : [],
      isActive: isActive !== false,
      displayOrder: Number(displayOrder) || 0,
    });

    await logAuditEvent({
      action: "create_plan",
      actorId: req.user?._id,
      actorName: req.user?.name,
      targetId: plan._id,
      targetType: "pricing_plan",
      details: { name: plan.name, slug: plan.slug },
    });

    res.status(201).json({
      success: true,
      message: "Pricing plan created successfully",
      data: plan,
    });
  } catch (error) {
    console.error("SuperAdmin createPlan Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create pricing plan",
      error: error.message,
    });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      currency,
      billingCycle,
      maxMembers,
      maxTrainers,
      features,
      isActive,
      displayOrder,
    } = req.body;

    const updateData = {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price: Number(price) } : {}),
      ...(currency ? { currency } : {}),
      ...(billingCycle ? { billingCycle } : {}),
      ...(maxMembers !== undefined ? { maxMembers: Number(maxMembers) } : {}),
      ...(maxTrainers !== undefined
        ? { maxTrainers: Number(maxTrainers) }
        : {}),
      ...(features !== undefined
        ? { features: Array.isArray(features) ? features : [] }
        : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      ...(displayOrder !== undefined
        ? { displayOrder: Number(displayOrder) }
        : {}),
    };

    const plan = await SaaSPlan.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    await logAuditEvent({
      action: "update_plan",
      actorId: req.user?._id,
      actorName: req.user?.name,
      targetId: plan._id,
      targetType: "pricing_plan",
      details: { name: plan.name, slug: plan.slug },
    });

    res.status(200).json({
      success: true,
      message: "Pricing plan updated successfully",
      data: plan,
    });
  } catch (error) {
    console.error("SuperAdmin updatePlan Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update pricing plan",
      error: error.message,
    });
  }
};

exports.getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: broadcasts,
    });
  } catch (error) {
    console.error("SuperAdmin getBroadcasts Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load broadcasts",
      error: error.message,
    });
  }
};

exports.createBroadcast = async (req, res) => {
  try {
    const { title, message, audience, isActive } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Broadcast title and message are required",
      });
    }

    const broadcast = await Broadcast.create({
      title: title.trim(),
      message: message.trim(),
      audience: audience || "all",
      isActive: isActive !== false,
      createdBy: req.user._id,
    });

    await logAuditEvent({
      action: "create_broadcast",
      actorId: req.user._id,
      actorName: req.user.name,
      targetId: broadcast._id,
      targetType: "broadcast",
      details: { title: broadcast.title, audience: broadcast.audience },
    });

    res.status(201).json({
      success: true,
      message: "Broadcast created successfully",
      data: broadcast,
    });
  } catch (error) {
    console.error("SuperAdmin createBroadcast Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create broadcast",
      error: error.message,
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await require("../models/AuditLog")
      .find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("SuperAdmin getAuditLogs Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load audit logs",
      error: error.message,
    });
  }
};
