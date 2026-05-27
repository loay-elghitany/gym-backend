const Lead = require("../models/Lead");
const Tenant = require("../models/Tenant");

// Public route: Create a lead from landing page
exports.createLead = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { name, phone, email, notes } = req.body;

    // Find the tenant by slug (normalize to lower-case to avoid case issues)
    const slug = (subdomain || "").trim().toLowerCase();
    const tenant = await Tenant.findOne({ slug, status: "active" });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    // Check if lead with same phone already exists for this gym
    const existingLead = await Lead.findOne({
      gymId: tenant._id,
      phone,
    });

    if (existingLead) {
      // Update existing lead if it's not already converted
      if (existingLead.status !== "Converted") {
        existingLead.name = name || existingLead.name;
        existingLead.email = email || existingLead.email;
        existingLead.notes = notes || existingLead.notes;
        existingLead.status = "New";
        await existingLead.save();
        return res.status(200).json({
          success: true,
          message: "Lead updated successfully",
          data: existingLead,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "This phone number is already a member",
        });
      }
    }

    // Create new lead
    const lead = await Lead.create({
      name,
      phone,
      email,
      gymId: tenant._id,
      gymSlug: tenant.slug,
      notes,
      source: "landing_page",
    });

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create lead",
    });
  }
};

// Protected route: Get all leads for a gym owner
exports.getLeads = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { gymId: tenantId };
    if (status) {
      query.status = status;
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Lead.countDocuments(query);

    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch leads",
    });
  }
};

// Protected route: Update lead status
exports.updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const { tenantId } = req.user;

    const lead = await Lead.findOne({ _id: id, gymId: tenantId });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    lead.status = status || lead.status;
    if (notes) lead.notes = notes;

    // Update timestamps based on status
    if (status === "Contacted" && !lead.contactedAt) {
      lead.contactedAt = new Date();
    }
    if (status === "Converted" && !lead.convertedAt) {
      lead.convertedAt = new Date();
    }

    await lead.save();

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update lead",
    });
  }
};

// Protected route: Get lead statistics
exports.getLeadStats = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const stats = await Lead.aggregate([
      { $match: { gymId: tenantId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalLeads = await Lead.countDocuments({ gymId: tenantId });
    const newLeads = stats.find((s) => s._id === "New")?.count || 0;
    const contactedLeads = stats.find((s) => s._id === "Contacted")?.count || 0;
    const convertedLeads = stats.find((s) => s._id === "Converted")?.count || 0;
    const lostLeads = stats.find((s) => s._id === "Lost")?.count || 0;

    // Calculate conversion rate
    const conversionRate =
      totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        total: totalLeads,
        new: newLeads,
        contacted: contactedLeads,
        converted: convertedLeads,
        lost: lostLeads,
        conversionRate,
      },
    });
  } catch (error) {
    console.error("Error fetching lead stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch lead statistics",
    });
  }
};
