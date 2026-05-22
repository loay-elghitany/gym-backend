require("dotenv").config();
const connectDB = require("./src/config/database");
const Tenant = require("./src/models/Tenant");
const User = require("./src/models/User");

(async function seed() {
  try {
    await connectDB();

    const email = process.env.SEED_ADMIN_EMAIL;
    const plainPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!email || !plainPassword) {
      throw new Error(
        "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to seed the super admin account",
      );
    }

    // Ensure system tenant exists
    let systemTenant = await Tenant.findOne({ slug: "system" });
    if (!systemTenant) {
      systemTenant = await Tenant.create({
        name: "System Tenant",
        slug: "system",
        email: "system@platform.com",
        status: "active",
        isActive: true,
        maxMembers: 1,
        subscriptionStatus: "active",
        subscriptionPlan: "enterprise",
      });
      console.log("Created system tenant:", systemTenant._id.toString());
    } else {
      console.log("System tenant exists:", systemTenant._id.toString());
    }

    // Check for existing super admin by email or role
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      console.log("User with that email already exists:", existing.email);
      process.exit(0);
    }

    // Create superadmin user (user model will hash the password on save)
    const superAdmin = await User.create({
      name: "Super Admin",
      email: email.trim().toLowerCase(),
      password: plainPassword,
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

    console.log("Super admin created:", superAdmin.email);
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
})();
