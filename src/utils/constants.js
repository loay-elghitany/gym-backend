/**
 * Constants for the application
 */

const ROLES = {
  SUPERADMIN: "superadmin",
  GYMOWNER: "gymowner",
  RECEPTIONIST: "receptionist",
  TRAINER: "trainer",
  MEMBER: "member",
};

const PERMISSIONS = {
  MANAGE_MEMBERS: "manage_members",
  MANAGE_TRAINERS: "manage_trainers",
  MANAGE_CLASSES: "manage_classes",
  MANAGE_BILLING: "manage_billing",
  VIEW_REPORTS: "view_reports",
  MANAGE_TENANT: "manage_tenant",
};

const SUBSCRIPTION_PLANS = {
  BASIC: "basic",
  PROFESSIONAL: "professional",
  ENTERPRISE: "enterprise",
};

const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  TRIAL: "trial",
};

const MEMBERSHIP_DURATION_UNITS = {
  DAYS: "days",
  WEEKS: "weeks",
  MONTHS: "months",
  YEARS: "years",
};

const BILLING_CYCLES = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
};

// Role to permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: Object.values(PERMISSIONS),
  [ROLES.GYMOWNER]: [
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_TRAINERS,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_TENANT,
  ],
  [ROLES.RECEPTIONIST]: [PERMISSIONS.MANAGE_MEMBERS, PERMISSIONS.VIEW_REPORTS],
  [ROLES.TRAINER]: [PERMISSIONS.MANAGE_CLASSES, PERMISSIONS.VIEW_REPORTS],
  [ROLES.MEMBER]: [],
};

module.exports = {
  ROLES,
  PERMISSIONS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS,
  MEMBERSHIP_DURATION_UNITS,
  BILLING_CYCLES,
  ROLE_PERMISSIONS,
};
