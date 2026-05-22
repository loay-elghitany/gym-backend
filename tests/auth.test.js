process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.JWT_SECRET = "test-secret-key";

jest.setTimeout(30000);

const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");

let mongoServer;
let app;
let server;
let testApp;
let authMiddleware;
let testTenant;
let testUser;

const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");

beforeAll(async () => {
  jest.setTimeout(30000);
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  authMiddleware = require("../src/middleware/authMiddleware").authMiddleware;

  const loaded = require("../server");
  app = loaded.app;
  server = loaded.server;

  testApp = express();
  testApp.get("/test-auth", authMiddleware, (req, res) => {
    res.status(200).json({
      success: true,
      tenantId: req.user.tenantId?.toString(),
      role: req.user.role,
    });
  });

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once("open", resolve));
  }
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  if (server && typeof server.close === "function") {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();

  testTenant = await Tenant.create({
    name: "Test Gym",
    slug: "test-gym",
    email: "owner@testgym.com",
    status: "active",
    isActive: true,
  });

  testUser = await User.create({
    name: "Test Member",
    email: "member@testgym.com",
    password: "Password123!",
    role: "member",
    tenantId: testTenant._id,
    tenantSlug: testTenant.slug,
    isActive: true,
  });
});

describe("Authentication and tenant isolation", () => {
  test("should reject login with invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "member@testgym.com",
      password: "WrongPassword!",
      tenantSlug: testTenant.slug,
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("should return a valid JWT with correct tenantId and role on successful login", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "member@testgym.com",
      password: "Password123!",
      tenantSlug: testTenant.slug,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.token).toBeTruthy();

    const payload = jwt.verify(
      response.body.data.token,
      process.env.JWT_SECRET,
    );
    expect(payload.tenantId).toBe(testTenant._id.toString());
    expect(payload.role).toBe("member");
  });

  test("should reject requests without an authorization token", async () => {
    const response = await request(testApp).get("/test-auth");
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("should reject requests with a tampered token", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "member@testgym.com",
      password: "Password123!",
      tenantSlug: testTenant.slug,
    });

    const originalToken = login.body.data.token;
    const tamperedToken = `${originalToken.slice(0, -1)}${originalToken.slice(-1) === "a" ? "b" : "a"}`;

    const response = await request(testApp)
      .get("/test-auth")
      .set("Authorization", `Bearer ${tamperedToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
