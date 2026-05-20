const Tenant = require("../models/Tenant");

/**
 * Tenant Middleware
 * Extracts the tenant slug from the request headers and attaches tenant information to the request
 * This ensures all requests are scoped to a specific tenant
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // Extract tenant slug from custom header, subdomain, or host header
    let tenantSlug = req.headers["x-tenant-slug"] || req.subdomains[0];

    if (!tenantSlug && req.headers.host) {
      const host = req.headers.host.split(":")[0];
      if (host.endsWith(".localhost")) {
        tenantSlug = host.replace(/\.localhost$/, "");
      } else if (host.split(".").length > 2) {
        tenantSlug = host.split(".")[0];
      }
    }

    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        message:
          "Tenant slug is required. Please provide x-tenant-slug header or use subdomain.",
      });
    }

    // Find the tenant in the database
    const tenant = await Tenant.findOne({ slug: tenantSlug });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Check if tenant is active
    if (!tenant.isActive) {
      return res.status(403).json({
        success: false,
        message: "This tenant account is inactive",
      });
    }

    // Check subscription status
    if (tenant.subscriptionStatus === "suspended") {
      return res.status(403).json({
        success: false,
        message: "This tenant account has been suspended",
      });
    }

    // Attach tenant information to the request
    req.tenant = {
      _id: tenant._id,
      slug: tenant.slug,
      name: tenant.name,
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionPlan: tenant.subscriptionPlan,
      maxMembers: tenant.maxMembers,
      maxTrainers: tenant.maxTrainers,
    };

    // Also attach raw tenant document for advanced queries if needed
    req.tenantDocument = tenant;

    next();
  } catch (error) {
    console.error("Tenant Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing tenant information",
      error: error.message,
    });
  }
};

module.exports = tenantMiddleware;
