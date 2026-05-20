# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create .env File

```bash
cp .env.example .env
```

### 3. Update .env with Local MongoDB

```env
MONGODB_URI=mongodb://localhost:27017/gym-backend
JWT_SECRET=dev-secret-key-12345
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Test the API

```bash
# Health check
curl http://localhost:5000/health

# Should return:
# {"success":true,"message":"Server is running","timestamp":"..."}
```

---

## Testing the Multi-Tenant System

### Step 1: Create a Tenant (DB Seed)

Open MongoDB Compass or MongoDB CLI and insert:

```javascript
// In 'tenants' collection
{
  "name": "My Awesome Gym",
  "slug": "my-gym",
  "email": "owner@mygym.com",
  "phone": "123-456-7890",
  "subscriptionStatus": "active",
  "subscriptionPlan": "professional",
  "maxMembers": 500,
  "maxTrainers": 20,
  "isActive": true
}
```

### Step 2: Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "x-tenant-slug: my-gym" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Pass123",
    "role": "gymowner"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "gymowner",
      "tenantId": "507f1f77bcf86cd799439010",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token** - you'll need it for next steps!

### Step 3: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "x-tenant-slug: my-gym" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Pass123"
  }'
```

### Step 4: Create Members

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:5000/api/users \
  -H "x-tenant-slug: my-gym" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "Pass123",
    "role": "member",
    "phone": "987-654-3210"
  }'
```

### Step 5: Get All Users

```bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=10" \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6: Create Membership Plans

```bash
curl -X POST http://localhost:5000/api/memberships \
  -H "x-tenant-slug: my-gym" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Basic Membership",
    "description": "Access to all gym equipment",
    "price": 29.99,
    "currency": "USD",
    "duration": 1,
    "durationUnit": "months",
    "features": ["Gym access", "Locker room"],
    "billingCycle": "monthly",
    "accessToEquipment": true,
    "accessToPersonalTrainer": false
  }'
```

### Step 7: Get All Memberships

```bash
curl -X GET "http://localhost:5000/api/memberships" \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Using Postman (Recommended)

### 1. Create Environment

Click **Environments** → **Create**

**Environment Name:** Gym SaaS Dev

**Variables:**
| Variable | Value |
|----------|-------|
| `base_url` | http://localhost:5000 |
| `tenant_slug` | my-gym |
| `token` | (leave empty, fill after login) |

### 2. Create Collection Requests

#### Register

- **Method:** POST
- **URL:** `{{base_url}}/api/auth/register`
- **Headers:**
  ```
  x-tenant-slug: {{tenant_slug}}
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Pass123",
    "role": "gymowner"
  }
  ```

#### Login

- **Method:** POST
- **URL:** `{{base_url}}/api/auth/login`
- **Headers:**
  ```
  x-tenant-slug: {{tenant_slug}}
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "Pass123"
  }
  ```

**After Login**, go to **Tests** tab and add:

```javascript
var jsonData = pm.response.json();
pm.environment.set("token", jsonData.data.token);
```

#### Get Current User

- **Method:** GET
- **URL:** `{{base_url}}/api/auth/me`
- **Headers:**
  ```
  x-tenant-slug: {{tenant_slug}}
  Authorization: Bearer {{token}}
  ```

---

## Common Issues & Solutions

### Issue: "Tenant slug is required"

**Solution:** Add header `x-tenant-slug: my-gym` to all requests

### Issue: "No token provided"

**Solution:** Add header `Authorization: Bearer <your-token>`

### Issue: "User not found"

**Solution:** Make sure you've registered a user first

### Issue: "MongoDB connection error"

**Solution:**

- Check MongoDB is running: `mongod`
- Check URI in .env file
- Try default URI: `mongodb://localhost:27017/gym-backend`

### Issue: "Port 5000 already in use"

**Solution:**

```bash
# Change port in .env
PORT=5001

# Or kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## Project Structure Quick Reference

```
src/
├── models/                 # Database schemas
│   ├── Tenant.js          # Gym/tenant
│   ├── User.js            # Users (members, trainers, etc)
│   └── Membership.js      # Membership plans
│
├── controllers/            # Business logic
│   ├── authController.js  # Login/register
│   ├── userController.js  # User CRUD
│   └── membershipController.js
│
├── routes/                 # API routes
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── membershipRoutes.js
│
├── middleware/             # Custom middleware
│   ├── tenantMiddleware.js # Multi-tenancy
│   └── authMiddleware.js   # JWT & roles
│
└── config/                 # Configuration
    ├── database.js        # MongoDB connection
    ├── config.js          # App config
    └── errorHandler.js    # Error handling
```

---

## Key Concepts

### 🏢 Tenant

A gym/business using the SaaS. Each tenant has isolated data.

### 👤 User

A person (member, trainer, owner) with a role assigned to a specific tenant.

### 📋 Membership

A subscription plan created by a gym owner for members.

### 🔐 JWT Token

Secure authentication token. Sent with every request via header: `Authorization: Bearer <token>`

### 🏷️ Tenant Slug

URL-friendly identifier for a gym (e.g., "my-gym"). Sent via header: `x-tenant-slug: my-gym`

---

## Next Steps

1. **Add more models** (Classes, Attendance, etc.)
2. **Create admin endpoints** for superadmin operations
3. **Add email notifications** for member registration
4. **Implement Stripe integration** for billing
5. **Add real-time updates** with WebSockets
6. **Write comprehensive tests** with Jest
7. **Add API documentation** with Swagger/OpenAPI

---

## Development Workflow

```bash
# 1. Start development server
npm run dev

# 2. In another terminal, test API
curl http://localhost:5000/health

# 3. Make changes to code
# (Server auto-reloads with nodemon)

# 4. Check MongoDB
# Use MongoDB Compass to view data

# 5. Debug with logs
# All console.log outputs appear in terminal
```

---

## Tips & Tricks

### 1. Use MongoDB Compass

Visual database management tool - makes debugging easier.

### 2. Use Environment Variables

Never hardcode secrets. Use .env file.

### 3. Check Database Indexes

```javascript
// In MongoDB shell
db.users.getIndexes();
```

### 4. Monitor Requests

Add logging in middleware:

```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### 5. Clear Database (Development Only)

```bash
# In MongoDB Compass: Right-click collection → Drop Collection
```

---

## Need Help?

- 📖 Read [ARCHITECTURE.md](./ARCHITECTURE.md) for deep dives
- 📘 Read [README.md](./README.md) for full API documentation
- 🐛 Check console logs for error messages
- 🔍 Search codebase for similar implementations

---

**Happy coding! 🚀**
