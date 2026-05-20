# Security Checklist & Best Practices

## Pre-Production Checklist

### Environment & Secrets

- [ ] **JWT Secret** - Change from default

  ```env
  JWT_SECRET=<generate-strong-random-key>
  # Use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] **MongoDB URI** - Use secure connection

  ```env
  # For Atlas
  MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db
  # Ensure IP whitelist is configured in Atlas
  ```

- [ ] **Node Environment** - Set to production

  ```env
  NODE_ENV=production
  ```

- [ ] **CORS Origins** - Restrict to your domains
  ```env
  CORS_ORIGIN=https://app.gymsaas.com,https://admin.gymsaas.com
  # Never use '*' in production
  ```

### Authentication & Authorization

- [ ] **Password Requirements**
  - Minimum 6 characters (update to 8+ recommended)
  - Consider adding strength validation
  - Implement password history (don't allow previous N passwords)

- [ ] **JWT Token Expiration**

  ```env
  JWT_EXPIRE=7d  # Consider 24h-7d based on security needs
  ```

- [ ] **Token Refresh Mechanism**
  - Implement refresh tokens (separate from access tokens)
  - Access tokens: 15 minutes
  - Refresh tokens: 7 days
  - [See implementation guide](#implementing-refresh-tokens)

- [ ] **Session Management**
  - Add logout endpoint (token blacklist)
  - Force logout on suspicious activity
  - Invalidate tokens on password change

### Data Protection

- [ ] **TenantId Validation** - CRITICAL

  ```javascript
  // ✅ Every query must filter by tenant
  User.find({ tenantId: req.tenant._id });

  // ❌ Never this:
  User.find({});
  ```

- [ ] **Data Encryption**
  - Encrypt sensitive data (SSN, phone numbers)
  - Use bcrypt for passwords ✅ (already implemented)
  - Consider encrypting PII at rest

- [ ] **Audit Logging**
  - Log all data modifications
  - Log failed authentication attempts
  - Log admin actions
  - Store logs securely (not in source code)

### API Security

- [ ] **Rate Limiting**

  ```javascript
  // Install: npm install express-rate-limit
  const rateLimit = require("express-rate-limit");

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });

  app.use("/api/", limiter);
  ```

- [ ] **Input Validation**

  ```javascript
  // Install: npm install joi
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  ```

- [ ] **SQL/NoSQL Injection Prevention** ✅ (Mongoose handles this)
  - Use parameterized queries ✅
  - Never use `eval()` or `new Function()`

- [ ] **CORS Configuration** ✅ (Already configured)

  ```javascript
  // Verify CORS is restricting origins
  // Never use '*' for credentials
  ```

- [ ] **HTTPS Only**
  - Force HTTPS in production
  - Add HSTS header
  - ```javascript
    const helmet = require("helmet");
    app.use(helmet());
    ```

### Deployment Security

- [ ] **Environment Variables**
  - Never commit .env file
  - Use secure secret management (AWS Secrets Manager, HashiCorp Vault)
  - Rotate secrets regularly

- [ ] **Dependencies**
  - Check for vulnerabilities: `npm audit`
  - Keep dependencies updated: `npm update`
  - Use `npm audit fix` to patch vulnerabilities
  - Consider using Snyk or similar tools

- [ ] **Error Handling**
  - Don't expose stack traces in production
  - Log errors securely
  - Return generic error messages to clients

  ```javascript
  // ✅ In production
  res.status(500).json({ message: "An error occurred" });

  // ❌ Don't do this
  res.status(500).json({ message: error.message, stack: error.stack });
  ```

- [ ] **Headers Security**

  ```javascript
  const helmet = require("helmet");
  app.use(helmet());
  // Adds security headers like CSP, X-Frame-Options, etc.
  ```

- [ ] **HTTPS Certificate**
  - Use valid SSL/TLS certificate
  - Auto-renew certificates (Let's Encrypt)
  - Configure strong cipher suites

### Database Security

- [ ] **MongoDB Authentication**
  - Enable authentication
  - Use strong passwords
  - Create user with minimal required roles

- [ ] **Connection Security**
  - Use MongoDB+srv connection string
  - Enable IP whitelist
  - Use TLS/SSL for connections

- [ ] **Backups**
  - Enable automated backups
  - Test backup restoration
  - Store backups securely

- [ ] **Indexes**
  - Verify indexes on `tenantId` ✅
  - Monitor slow queries
  - Optimize queries

### Monitoring & Logging

- [ ] **Activity Logging**

  ```javascript
  // Log authentication attempts
  console.log(`Login attempt: ${email} - ${success ? "SUCCESS" : "FAILED"}`);
  ```

- [ ] **Error Monitoring**
  - Use Sentry or similar
  - Real-time error alerts
  - Track error trends

- [ ] **Performance Monitoring**
  - Monitor API response times
  - Track database query performance
  - Set up alerts for anomalies

- [ ] **Security Monitoring**
  - Monitor for suspicious patterns
  - Track brute force attempts
  - Monitor for data exfiltration attempts

### Testing

- [ ] **Security Testing**
  - Test authentication bypass attempts
  - Test authorization violations
  - Test multi-tenancy isolation
  - Test SQL/NoSQL injection
  - Test CORS misconfiguration

- [ ] **Integration Tests**
  ```javascript
  describe("Multi-Tenancy Security", () => {
    test("User from Tenant A cannot access Tenant B data", async () => {
      // Test implementation
    });
  });
  ```

## Implementing Best Practices

### 1. Helmet for Security Headers

```bash
npm install helmet
```

```javascript
// server.js
const helmet = require("helmet");
app.use(helmet());
```

### 2. Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
// server.js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP",
});

app.use("/api/", limiter);
```

### 3. Input Validation with Joi

```bash
npm install joi
```

```javascript
// utils/validators.js
const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().required().max(100),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("member", "trainer", "receptionist", "gymowner"),
});

module.exports = { registerSchema };
```

### 4. Implementing Refresh Tokens

```javascript
// models/RefreshToken.js
const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800, // 7 days
  },
});
```

### 5. Enhanced Error Handling

```javascript
// config/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Don't expose internal errors in production
  const message = isDevelopment ? err.message : "An error occurred";

  // Log the actual error for debugging
  if (!isDevelopment) {
    console.error("[ERROR]", {
      message: err.message,
      stack: err.stack,
      timestamp: new Date(),
      path: req.path,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message,
    ...(isDevelopment && { stack: err.stack }),
  });
};
```

## Common Vulnerabilities & Fixes

### 1. NoSQL Injection

```javascript
// ❌ VULNERABLE
const user = await User.findOne({ email: req.body.email });

// ✅ SAFE (Already using Mongoose)
const user = await User.findOne({
  email: sanitize(req.body.email),
});
```

### 2. Broken Access Control

```javascript
// ❌ VULNERABLE
User.findById(req.params.id); // No tenant check

// ✅ SAFE
User.findOne({
  _id: req.params.id,
  tenantId: req.tenant._id,
});
```

### 3. Sensitive Data Exposure

```javascript
// ❌ VULNERABLE
res.json({ user: dbUser }); // Exposes password hash

// ✅ SAFE
const { password, ...userWithoutPassword } = user.toObject();
res.json({ user: userWithoutPassword });
```

### 4. Broken Authentication

```javascript
// ❌ VULNERABLE
jwt.verify(token, "secret"); // Hardcoded secret

// ✅ SAFE
jwt.verify(token, process.env.JWT_SECRET);
```

## Security Headers to Add

```javascript
// Install: npm install helmet

const helmet = require("helmet");

app.use(helmet());

// Customize specific headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  }),
);
```

## Regular Security Tasks

### Weekly

- [ ] Check npm audit for vulnerabilities
- [ ] Review error logs for suspicious patterns
- [ ] Monitor API response times

### Monthly

- [ ] Update dependencies
- [ ] Review access logs
- [ ] Test authentication/authorization flows
- [ ] Backup database

### Quarterly

- [ ] Security audit of codebase
- [ ] Penetration testing
- [ ] Review and update security policies
- [ ] Update SSL/TLS certificates

### Annually

- [ ] Full security assessment
- [ ] Update security practices based on industry trends
- [ ] Review and update all documentation

## Security Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security: https://nodejs.org/en/docs/guides/security/
- MongoDB Security: https://docs.mongodb.com/manual/security/
- Express Security: https://expressjs.com/en/advanced/best-practice-security.html

## Incident Response

### If You Suspect a Breach

1. **Immediately:**
   - Stop the application
   - Isolate affected systems
   - Preserve logs and evidence

2. **Within 1 Hour:**
   - Notify your security team
   - Assess the scope of the breach
   - Check for unauthorized access

3. **Within 24 Hours:**
   - Document findings
   - Begin remediation
   - Notify affected users if required
   - Update security measures

4. **Follow-up:**
   - Post-incident analysis
   - Update security procedures
   - Prevent recurrence

---

**Remember: Security is an ongoing process, not a one-time fix!**
