# Gym Management SaaS - Backend

A multi-tenant backend for a B2B2C Gym Management Software-as-a-Service (SaaS) platform. Built with Node.js, Express, and MongoDB.

## 🏗️ Architecture Overview

### Multi-Tenancy Design

- **Tenant Isolation**: Each gym (tenant) has completely isolated data
- **Tenant Middleware**: Extracts tenant context from request headers (`x-tenant-slug`) or subdomain
- **Tenant-Aware Queries**: All database queries are scoped to the current tenant via `tenantId`

### Key Features

- **Role-Based Access Control (RBAC)**: SuperAdmin, GymOwner, Receptionist, Trainer, Member
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Data Validation**: Input validation for all endpoints
- **Error Handling**: Centralized error handling middleware
- **Scalable Structure**: Easy to extend with new modules

## 📁 Folder Structure

```
gym-backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   ├── config.js        # App configuration
│   │   └── errorHandler.js  # Error handling
│   │
│   ├── models/              # Mongoose schemas
│   │   ├── Tenant.js        # Gym/Tenant model
│   │   ├── User.js          # User model
│   │   └── Membership.js    # Membership plans
│   │
│   ├── controllers/         # Business logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── membershipController.js
│   │
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── membershipRoutes.js
│   │
│   ├── middleware/          # Custom middleware
│   │   ├── tenantMiddleware.js   # Tenant context extraction
│   │   └── authMiddleware.js     # JWT verification
│   │
│   └── utils/               # Utilities
│       ├── constants.js     # App constants
│       ├── validators.js    # Validation helpers
│       └── responseFormatter.js
│
├── server.js                # Main server file
├── .env.example             # Environment variables template
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd gym-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   ```

4. **Configure `.env` file**

   ```env
   MONGODB_URI=mongodb://localhost:27017/gym-backend
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-key
   CORS_ORIGIN=http://localhost:3000,http://localhost:3001
   ```

5. **Start the server**

   ```bash
   # Development (with hot reload)
   npm run dev

   # Production
   npm start
   ```

6. **Verify the server is running**
   ```bash
   curl http://localhost:5000/health
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User

```
POST /api/auth/register
Headers: x-tenant-slug: gym-slug
Body: { name, email, password, role }
```

#### Login

```
POST /api/auth/login
Headers: x-tenant-slug: gym-slug
Body: { email, password }
```

#### Get Current User

```
GET /api/auth/me
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
```

#### Update Profile

```
PUT /api/auth/update-profile
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
Body: { name, phone, avatar }
```

#### Change Password

```
POST /api/auth/change-password
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
Body: { oldPassword, newPassword }
```

### User Management Endpoints

#### Get All Users (Tenant)

```
GET /api/users?page=1&limit=10&role=member&search=john
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
```

#### Get User by ID

```
GET /api/users/:id
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
```

#### Create User (GymOwner only)

```
POST /api/users
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
Body: { name, email, password, role, phone }
```

#### Update User (GymOwner only)

```
PUT /api/users/:id
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
Body: { name, phone, role, isActive }
```

#### Delete User (GymOwner only)

```
DELETE /api/users/:id
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
```

### Membership Endpoints

#### Get All Membership Plans

```
GET /api/memberships?page=1&limit=10
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
```

#### Get Membership by ID

```
GET /api/memberships/:id
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
```

#### Create Membership (GymOwner only)

```
POST /api/memberships
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
Body: { name, description, price, currency, duration, durationUnit, features, billingCycle }
```

#### Update Membership (GymOwner only)

```
PUT /api/memberships/:id
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
Body: { name, description, price, duration, durationUnit, features, isActive, displayOrder }
```

#### Delete Membership (GymOwner only)

```
DELETE /api/memberships/:id
Headers:
  x-tenant-slug: gym-slug
  Authorization: Bearer <token>
```

## 🔐 Security Features

### Multi-Tenancy

- All database queries automatically filtered by `tenantId`
- Users can only access data from their assigned tenant
- SuperAdmin users have cross-tenant access (when needed)

### Authentication & Authorization

- JWT token-based authentication
- Role-based access control (RBAC)
- Permission-based access control
- Password hashing with bcrypt

### Input Validation

- Email format validation
- Password strength requirements
- Phone number validation
- Slug format validation

## 📊 Database Models

### Tenant Model

```javascript
{
  name: String,
  slug: String (unique),
  email: String,
  phone: String,
  address: Object,
  subscriptionStatus: 'active' | 'inactive' | 'suspended' | 'trial',
  subscriptionPlan: 'basic' | 'professional' | 'enterprise',
  maxMembers: Number,
  maxTrainers: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### User Model

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  avatar: String,
  role: 'superadmin' | 'gymowner' | 'receptionist' | 'trainer' | 'member',
  tenantId: ObjectId (ref: Tenant),
  tenantSlug: String,
  managedTenants: [ObjectId],
  isActive: Boolean,
  lastLogin: Date,
  permissions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Membership Model

```javascript
{
  name: String,
  tenantId: ObjectId (ref: Tenant),
  tenantSlug: String,
  description: String,
  price: Number,
  currency: String,
  duration: Number,
  durationUnit: 'days' | 'weeks' | 'months' | 'years',
  features: [String],
  maxClassesPerWeek: Number,
  accessToEquipment: Boolean,
  accessToPersonalTrainer: Boolean,
  billingCycle: 'monthly' | 'quarterly' | 'annual',
  isActive: Boolean,
  displayOrder: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🛣️ Middleware Flow

1. **Request arrives**
2. **tenantMiddleware** → Extracts tenant slug, validates tenant, attaches `req.tenant`
3. **authMiddleware** → Verifies JWT token, attaches `req.user`
4. **authorize()** → Checks user role
5. **checkPermission()** → Checks user permissions
6. **Controller** → Business logic
7. **Response** → Formatted response

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5000/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "x-tenant-slug: my-gym" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "x-tenant-slug: my-gym" \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Pass123"}'
```

### Using Postman

1. Import the API endpoints
2. Create an environment with:
   - `base_url`: http://localhost:5000
   - `tenant_slug`: my-gym
   - `token`: <JWT token from login>
3. Use `{{base_url}}` and `{{tenant_slug}}` in requests

## 🔄 Data Isolation Example

```javascript
// Gym A (tenant-a) - GymOwner user
// Only sees their own members
GET /api/users
Headers: x-tenant-slug: tenant-a, Authorization: Bearer <token_a>
// Returns: Only users from tenant-a with tenantId matching tenant-a._id

// Gym B (tenant-b) - GymOwner user
// Cannot access Gym A's data
GET /api/users
Headers: x-tenant-slug: tenant-b, Authorization: Bearer <token_b>
// Returns: Only users from tenant-b
// Would get 403 if trying to access tenant-a resources
```

## 📝 Environment Variables

```env
# Required
MONGODB_URI=mongodb://localhost:27017/gym-backend
JWT_SECRET=your-super-secret-key-change-this

# Optional (with defaults)
PORT=5000
NODE_ENV=development
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
LOG_LEVEL=info
```

## 🚧 Future Enhancements

- [ ] Email verification
- [ ] Password reset flow
- [ ] Two-factor authentication
- [ ] Membership billing integration (Stripe)
- [ ] Class scheduling system
- [ ] Attendance tracking
- [ ] Reports and analytics
- [ ] File uploads (avatars, documents)
- [ ] Email notifications
- [ ] Real-time notifications (WebSockets)
- [ ] API rate limiting
- [ ] Audit logging
- [ ] Data export functionality

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Built with ❤️ for Gym Management**
