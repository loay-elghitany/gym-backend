process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

jest.setTimeout(30000);

const request = require("supertest");
const mongoose = require("mongoose");
const {
  setupTestServer,
  clearDatabase,
  closeTestServer,
} = require("./testServer");
const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");
const MembershipPackage = require("../src/models/MembershipPackage");
const CheckIn = require("../src/models/CheckIn");

let app;
let tenant;
let ownerUser;
let memberUser;
let ownerToken;
let memberToken;

beforeAll(async () => {
  const context = await setupTestServer();
  app = context.app;
});

afterAll(async () => {
  await closeTestServer();
});

beforeEach(async () => {
  await clearDatabase();

  tenant = await Tenant.create({
    name: "Test Gym",
    slug: "test-gym",
    email: "owner@testgym.com",
    status: "active",
    isActive: true,
  });

  ownerUser = await User.create({
    name: "Gym Owner",
    email: "owner@testgym.com",
    password: "Password123!",
    role: "gymowner",
    tenantId: tenant._id,
    tenantSlug: tenant.slug,
    isActive: true,
    telegramChatId: "123456789",
  });

  memberUser = await User.create({
    name: "New Member",
    email: "member@testgym.com",
    password: "Password123!",
    role: "member",
    tenantId: tenant._id,
    tenantSlug: tenant.slug,
    isActive: true,
  });

  const ownerLogin = await request(app).post("/api/auth/login").send({
    email: "owner@testgym.com",
    password: "Password123!",
    tenantSlug: tenant.slug,
  });

  const memberLogin = await request(app).post("/api/auth/login").send({
    email: "member@testgym.com",
    password: "Password123!",
    tenantSlug: tenant.slug,
  });

  ownerToken = ownerLogin.body.data.token;
  memberToken = memberLogin.body.data.token;
});

describe("owner metrics and attendance scan", () => {
  test("should calculate monthly revenue using membership package references", async () => {
    const packageDoc = await MembershipPackage.create({
      name: "Premium",
      price: 130,
      durationInDays: 30,
      sessionCount: 12,
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
      isActive: true,
    });

    await User.findByIdAndUpdate(memberUser._id, {
      $set: {
        "subscription.status": "active",
        "subscription.expiresAt": new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ),
        "subscription.packageId": packageDoc._id,
        "subscription.price": 0,
      },
    });

    const response = await request(app)
      .get("/api/owner/metrics")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-tenant-slug", tenant.slug);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.monthlyRevenue).toBe(130);
  });

  test("should calculate forecast revenue using member package references", async () => {
    const packageDoc = await MembershipPackage.create({
      name: "Starter",
      price: 90,
      durationInDays: 30,
      sessionCount: 8,
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
      isActive: true,
    });

    await User.findByIdAndUpdate(memberUser._id, {
      $set: {
        "subscription.status": "active",
        "subscription.expiresAt": new Date(
          Date.now() + 10 * 24 * 60 * 60 * 1000,
        ),
        "subscription.packageId": packageDoc._id,
        "subscription.price": 0,
      },
    });

    const response = await request(app)
      .get("/api/owner/metrics/forecast")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-tenant-slug", tenant.slug);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.expectedRenewals).toBeGreaterThan(0);
  });

  test("should scan a QR payload and log attendance for the matching tenant", async () => {
    const payload = JSON.stringify({
      memberId: memberUser._id.toString(),
      tenantSlug: tenant.slug,
    });

    const response = await request(app)
      .post("/api/attendance/scan")
      .set("Authorization", `Bearer ${memberToken}`)
      .set("x-tenant-slug", tenant.slug)
      .send({ payload });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const refreshedMember = await User.findById(memberUser._id).lean();
    const checkInCount = await CheckIn.countDocuments({
      user: memberUser._id,
      tenantId: tenant._id,
    });

    expect(refreshedMember.lastAttendanceAt).toBeTruthy();
    expect(checkInCount).toBe(1);
  });

  test("should group peak-hours using Africa/Cairo local time", async () => {
    await CheckIn.create({
      user: memberUser._id,
      tenantId: tenant._id,
      status: "checked_in",
      checkInAt: new Date("2026-05-24T08:00:00.000Z"),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const response = await request(app)
      .get("/api/attendance/peak-hours")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-tenant-slug", tenant.slug);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.peakHours[11].count).toBe(1);
    expect(response.body.data.peakHours[8].count).toBe(0);
  });
});
