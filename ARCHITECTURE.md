# Multi-Tenant Architecture Guide

## Overview

This document explains the multi-tenancy architecture implemented in the Gym Management SaaS backend.

## What is Multi-Tenancy?

Multi-tenancy is an architecture where a single instance of software serves multiple customers (tenants) while keeping their data completely isolated. In this case:

- **Tenant** = A Gym/Business
- **Users** = Members, Trainers, Receptionists, and Gym Owners of that gym
- **Data Isolation** = Each gym can ONLY see and access their own data

## Architecture Diagram

```
Request from Client
        ↓
    Express App
        ↓
tenantMiddleware (Extract & Validate Tenant)
        ↓
authMiddleware (Verify JWT & User)
        ↓
authorize() middleware (Check Role)
        ↓
Controller (Business Logic)
        ↓
Database Query (Filtered by tenantId)
        ↓
    Response
```

## How Tenant Identification Works

### 1. Tenant Identification Methods

The system identifies the tenant in order of preference:

```javascript
// From tenantMiddleware.js
const tenantSlug = req.headers["x-tenant-slug"] || req.subdomains[0];
```

#### Option A: Custom Header (Recommended for APIs)

```bash
curl -H "x-tenant-slug: my-gym" \
     http://api.gymsaas.com/api/users
```

#### Option B: Subdomain

```bash
curl http://my-gym.gymsaas.com/api/users
```

### 2. Tenant Validation Flow

```javascript
// 1. Extract slug from header/subdomain
const tenantSlug = req.headers["x-tenant-slug"];

// 2. Find tenant in database
const tenant = await Tenant.findOne({ slug: tenantSlug });

// 3. Validate tenant exists
if (!tenant) {
  return res.status(404).json({ message: "Tenant not found" });
}

// 4. Check if tenant is active
if (!tenant.isActive || tenant.subscriptionStatus === "suspended") {
  return res.status(403).json({ message: "Tenant account is inactive" });
}

// 5. Attach to request
req.tenant = {
  _id: tenant._id, // MongoDB ObjectId
  slug: tenant.slug, // URL-friendly slug
  name: tenant.name,
  // ... other tenant data
};
```

## Data Isolation Implementation

### Critical: TenantId Indexing

Every model that belongs to a tenant has:

```javascript
// In models
tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  index: true,  // ⬅️ CRITICAL for performance
}

// In queries
tenantSlug: {
  type: String,
  index: true,  // ⬅️ Also indexed for quick lookups
}
```

### Example: User Query

```javascript
// ✅ CORRECT - Filters by tenant
const users = await User.find({
  tenantId: req.tenant._id,
  role: "member",
});

// ❌ WRONG - Would expose data from all tenants
const users = await User.find({
  role: "member",
});
```

### Why This Matters

Imagine Gym A (Tenant A) and Gym B (Tenant B):

```javascript
// Gym A's API call
GET /api/users
Headers: x-tenant-slug: gym-a

// Query executed:
User.find({ tenantId: gym-a._id })
// Returns: Only gym-a's users ✅

// Gym B's API call
GET /api/users
Headers: x-tenant-slug: gym-b

// Query executed:
User.find({ tenantId: gym-b._id })
// Returns: Only gym-b's users ✅
```

## Authentication & Authorization

### JWT Token Verification

```javascript
// authMiddleware.js
const decoded = jwt.verify(token, JWT_SECRET);
const user = await User.findById(decoded.userId);

// CRITICAL: Verify user belongs to requested tenant
if (user.tenantId.toString() !== req.tenant._id.toString()) {
  return res.status(403).json({
    message: "Access denied. User does not belong to this tenant.",
  });
}
```

### Why This Check Exists

Even if someone has a valid JWT token, we verify they're trying to access their OWN tenant:

```javascript
// Scenario: Attacker with valid token from Gym A
// Tries to access Gym B's data

Request:
POST /api/users
x-tenant-slug: gym-b  // Trying to access different tenant
Authorization: Bearer <token-from-gym-a>

// In authMiddleware:
// token is valid ✅
// user exists ✅
// BUT user.tenantId (gym-a) !== req.tenant._id (gym-b) ❌
// Response: 403 Forbidden
```

## User Roles & Permissions

### Role Hierarchy

```
SuperAdmin
├── Can access all tenants
├── Full system permissions
└── Manages other GymOwners

GymOwner
├── Full access to their tenant
├── Can create/edit/delete members, trainers, classes
└── Can manage billing

Receptionist
├── Can view members
├── Can check-in members
└── Can view reports

Trainer
├── Can manage classes
├── Can create workout plans
└── Can view assigned members

Member
├── Can view own profile
├── Can book classes
└── Can view membership details
```

### Role-Based Access Control (RBAC)

```javascript
// In routes
router.post(
  "/users",
  authMiddleware,
  authorize("gymowner", "superadmin"), // Only these roles
  createUser,
);

// In middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
};
```

## Membership & Subscription Management

### Per-Tenant Memberships

Each gym has their own membership plans:

```javascript
// Gym A creates membership plans
Gym A:
├── Basic Plan ($29/month)
├── Professional Plan ($49/month)
└── Elite Plan ($99/month)

// Gym B has completely different plans
Gym B:
├── Starter Plan ($19/month)
├── Premium Plan ($39/month)
└── Ultimate Plan ($79/month)

// Database:
Membership:
  - _id: 123, name: "Basic", tenantId: gym-a._id
  - _id: 456, name: "Starter", tenantId: gym-b._id
```

### Query Isolation

```javascript
// Gym A's members see their membership plans
GET /api/memberships
x-tenant-slug: gym-a

// Query:
Membership.find({ tenantId: gym-a._id, isActive: true })
// Returns: Gym A's plans only ✅

// Gym B's members see their membership plans
GET /api/memberships
x-tenant-slug: gym-b

// Query:
Membership.find({ tenantId: gym-b._id, isActive: true })
// Returns: Gym B's plans only ✅
```

## Security Best Practices Implemented

### 1. **Always Filter by TenantId**

```javascript
// Every database query includes tenantId
User.find({ tenantId: req.tenant._id });
Membership.find({ tenantId: req.tenant._id });
Class.find({ tenantId: req.tenant._id });
```

### 2. **Tenant Validation at Every Endpoint**

```javascript
// tenantMiddleware runs BEFORE controllers
app.use("/api", tenantMiddleware);
```

### 3. **User-Tenant Match Verification**

```javascript
// Verify user belongs to requested tenant
if (user.tenantId !== req.tenant._id) {
  return res.status(403).json({ message: "Unauthorized" });
}
```

### 4. **Password Security**

```javascript
// Passwords are hashed with bcrypt
const salt = await bcrypt.genSalt(10);
user.password = await bcrypt.hash(password, salt);
```

### 5. **JWT Token Validation**

```javascript
// Tokens are verified and validated
jwt.verify(token, JWT_SECRET);
```

### 6. **Input Validation**

```javascript
// All inputs are validated
if (!email || !email.match(emailRegex)) {
  return res.status(400).json({ message: "Invalid email" });
}
```

## Adding New Features (Multi-Tenant Safe)

### Step 1: Create Model with TenantId

```javascript
// models/Class.js
const classSchema = new mongoose.Schema({
  name: String,
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true, // ⬅️ CRITICAL
  },
  tenantSlug: {
    type: String,
    index: true,
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // ... other fields
});
```

### Step 2: Filter Queries by TenantId

```javascript
// controllers/classController.js
exports.getAllClasses = async (req, res) => {
  const classes = await Class.find({
    tenantId: req.tenant._id, // ⬅️ ALWAYS filter
  });
  res.json({ success: true, data: classes });
};
```

### Step 3: Protect with Middleware

```javascript
// routes/classRoutes.js
router.get("/", authMiddleware, getAllClasses);
router.post("/", authMiddleware, authorize("trainer"), createClass);
```

## Testing Tenant Isolation

### Scenario Test: Two Gyms, One User Each

```javascript
// Create Gym A
POST /api/tenants (admin endpoint)
{
  name: "Strength Gym",
  slug: "strength-gym",
  email: "owner@strength.com"
}
// Response: Tenant A created with _id: "111"

// Create Gym B
POST /api/tenants (admin endpoint)
{
  name: "Yoga Studios",
  slug: "yoga-studios",
  email: "owner@yoga.com"
}
// Response: Tenant B created with _id: "222"

// Register User in Gym A
POST /api/auth/register
x-tenant-slug: strength-gym
{
  name: "John",
  email: "john@example.com",
  password: "Pass123"
}
// Response: JWT token, user created with tenantId: "111"

// Register User in Gym B
POST /api/auth/register
x-tenant-slug: yoga-studios
{
  name: "Sarah",
  email: "sarah@example.com",
  password: "Pass123"
}
// Response: JWT token, user created with tenantId: "222"

// John tries to see Gym B's members
GET /api/users
x-tenant-slug: yoga-studios
Authorization: Bearer <john's-token>
// Response: 403 Forbidden
// Reason: John's tenantId (111) ≠ yoga-studios tenantId (222)

// John can see Gym A's members
GET /api/users
x-tenant-slug: strength-gym
Authorization: Bearer <john's-token>
// Response: 200 OK, returns only strength-gym members
```

## Performance Considerations

### Indexing Strategy

```javascript
// Single field indexes
tenantId: {
  index: true;
}
tenantSlug: {
  index: true;
}
email: {
  index: true;
}

// Compound indexes for common queries
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ tenantId: 1, email: 1 });
membershipSchema.index({ tenantId: 1, isActive: 1 });
```

### Why This Matters

```javascript
// Without index: Scans entire User collection
// ~50ms for 1M documents ❌

User.find({ tenantId: "111", role: "member" });

// With index: Uses B-tree lookup
// ~5ms for 1M documents ✅
```

## Migration Strategy (Multi-Tenant Safe)

When migrating from single-tenant to multi-tenant:

1. **Add tenantId to all models**
2. **Create migration script** to populate tenantId for existing data
3. **Add tenantId validation** to prevent data corruption
4. **Test thoroughly** before production deployment

```javascript
// Migration example
async function migrateUsersToTenant(tenantId, tenantSlug) {
  const count = await User.updateMany(
    { tenantId: null }, // Find empty
    {
      tenantId: tenantId, // Set tenantId
      tenantSlug: tenantSlug,
    },
  );
  console.log(`Updated ${count.modifiedCount} users`);
}
```

## Monitoring Multi-Tenancy

### Key Metrics to Track

1. **Data Isolation Violations** - Count of 403 Forbidden due to tenant mismatch
2. **Query Performance** - Average query time per tenant
3. **Tenant Count** - Number of active tenants
4. **User Count per Tenant** - Distribution across tenants

### Logging Example

```javascript
// Log all tenant mismatches
if (user.tenantId.toString() !== req.tenant._id.toString()) {
  console.warn(`SECURITY: Tenant mismatch detected`, {
    userId: user._id,
    userTenant: user.tenantId,
    requestedTenant: req.tenant._id,
    timestamp: new Date(),
  });
}
```

## Conclusion

This multi-tenant architecture ensures:

✅ **Complete data isolation** between tenants  
✅ **Scalability** to thousands of customers  
✅ **Security** through multiple validation layers  
✅ **Performance** through proper indexing  
✅ **Flexibility** for future features

Always remember: **Every query must filter by tenantId!**
