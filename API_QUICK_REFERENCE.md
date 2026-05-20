# API Quick Reference

## Base URL

```
http://localhost:5000
```

## Required Headers

```
x-tenant-slug: <gym-slug>              # On all /api/* endpoints
Authorization: Bearer <jwt-token>      # On protected endpoints (except auth register/login)
Content-Type: application/json         # On all POST/PUT requests
```

## Authentication Endpoints

### POST /api/auth/register

Register a new user

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

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "_id", "name", "email", "role", "tenantId", ... },
    "token": "eyJhbGc..."
  }
}
```

### POST /api/auth/login

Login and get JWT token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "x-tenant-slug: my-gym" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Pass123"
  }'
```

### GET /api/auth/me

Get current user info

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>"
```

### PUT /api/auth/update-profile

Update user profile

```bash
curl -X PUT http://localhost:5000/api/auth/update-profile \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "phone": "987-654-3210",
    "avatar": "https://..."
  }'
```

### POST /api/auth/change-password

Change password

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "Pass123",
    "newPassword": "NewPass456"
  }'
```

---

## User Management Endpoints

### GET /api/users

List users (with pagination & filters)

```bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=10&role=member&search=john" \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `role` - Filter by role (optional)
- `search` - Search by name or email (optional)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "users": [ { ... }, { ... } ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

### GET /api/users/:id

Get user by ID

```bash
curl -X GET http://localhost:5000/api/users/507f1f77bcf86cd799439011 \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>"
```

### POST /api/users

Create user (GymOwner only)

```bash
curl -X POST http://localhost:5000/api/users \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "Pass123",
    "role": "member",
    "phone": "555-1234"
  }'
```

**Allowed Roles:**

- `superadmin` - System administrator
- `gymowner` - Gym owner (full access to gym)
- `receptionist` - Receptionist
- `trainer` - Trainer
- `member` - Gym member

### PUT /api/users/:id

Update user (GymOwner only)

```bash
curl -X PUT http://localhost:5000/api/users/507f1f77bcf86cd799439011 \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Updated",
    "phone": "555-5678",
    "role": "trainer",
    "isActive": true
  }'
```

### DELETE /api/users/:id

Delete user (GymOwner only)

```bash
curl -X DELETE http://localhost:5000/api/users/507f1f77bcf86cd799439011 \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>"
```

---

## Membership Endpoints

### GET /api/memberships

List membership plans

```bash
curl -X GET "http://localhost:5000/api/memberships?page=1&limit=10" \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>"
```

### GET /api/memberships/:id

Get membership plan

```bash
curl -X GET http://localhost:5000/api/memberships/507f1f77bcf86cd799439011 \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>"
```

### POST /api/memberships

Create membership plan (GymOwner only)

```bash
curl -X POST http://localhost:5000/api/memberships \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Membership",
    "description": "Full gym access with trainer",
    "price": 49.99,
    "currency": "USD",
    "duration": 1,
    "durationUnit": "months",
    "features": ["Gym access", "Personal trainer", "Classes"],
    "billingCycle": "monthly",
    "maxClassesPerWeek": 8,
    "accessToEquipment": true,
    "accessToPersonalTrainer": true
  }'
```

### PUT /api/memberships/:id

Update membership plan (GymOwner only)

```bash
curl -X PUT http://localhost:5000/api/memberships/507f1f77bcf86cd799439011 \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Membership v2",
    "price": 59.99,
    "features": ["Gym access", "Personal trainer", "Classes", "Sauna"],
    "isActive": true,
    "displayOrder": 2
  }'
```

### DELETE /api/memberships/:id

Delete membership plan (GymOwner only) - Soft delete

```bash
curl -X DELETE http://localhost:5000/api/memberships/507f1f77bcf86cd799439011 \
  -H "x-tenant-slug: my-gym" \
  -H "Authorization: Bearer <token>"
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

---

## Common Error Responses

| Status | Message                 | Solution                                   |
| ------ | ----------------------- | ------------------------------------------ |
| 400    | Tenant slug is required | Add `x-tenant-slug` header                 |
| 404    | Tenant not found        | Check tenant slug exists                   |
| 401    | No token provided       | Add `Authorization: Bearer <token>` header |
| 401    | Invalid token           | Check token is valid and not expired       |
| 403    | Access denied           | Check user role has permission             |
| 409    | User already exists     | Use different email                        |
| 500    | Internal server error   | Check server logs                          |

---

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/gym-backend

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

---

## Role Permissions

| Action            | SuperAdmin | GymOwner  | Receptionist | Trainer | Member  |
| ----------------- | ---------- | --------- | ------------ | ------- | ------- |
| Get Users         | ✅ All     | ✅ Tenant | ✅ Tenant    | ❌      | ❌      |
| Create User       | ✅         | ✅        | ❌           | ❌      | ❌      |
| Update User       | ✅         | ✅        | ❌           | ❌      | 🔄 Self |
| Delete User       | ✅         | ✅        | ❌           | ❌      | ❌      |
| Get Memberships   | ✅         | ✅        | ✅           | ✅      | ✅      |
| Create Membership | ✅         | ✅        | ❌           | ❌      | ❌      |
| Update Membership | ✅         | ✅        | ❌           | ❌      | ❌      |
| Delete Membership | ✅         | ✅        | ❌           | ❌      | ❌      |

---

## Testing Endpoints

### Using Postman

1. Create environment with variables
2. Use `{{base_url}}` for URL
3. Use `{{tenant_slug}}` for header
4. Use `{{token}}` for authentication

### Using cURL

```bash
# Save token to variable
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "x-tenant-slug: my-gym" \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Pass123"}' | jq -r '.data.token')

# Use token in requests
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-slug: my-gym" \
     http://localhost:5000/api/users
```

### Using JavaScript

```javascript
const tenant_slug = "my-gym";
const token = "your-token-here";

const response = await fetch("http://localhost:5000/api/users", {
  method: "GET",
  headers: {
    "x-tenant-slug": tenant_slug,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const data = await response.json();
console.log(data);
```

---

## Health Check

```bash
curl http://localhost:5000/health
```

**Response:**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Troubleshooting

**401 Unauthorized:**

- Check token is included
- Check token is not expired
- Check user belongs to tenant

**403 Forbidden:**

- Check user role has permission
- Check user belongs to requested tenant

**404 Not Found:**

- Check tenant slug exists
- Check resource ID exists
- Check spelling of endpoint

**400 Bad Request:**

- Check all required fields provided
- Check email is valid format
- Check headers are correct

---

See full documentation in README.md and QUICK_START.md
