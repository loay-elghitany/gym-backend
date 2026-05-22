jest.setTimeout(30000);

const request = require("supertest");
const {
  setupTestServer,
  clearDatabase,
  closeTestServer,
} = require("./testServer");
const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");
const CheckIn = require("../src/models/CheckIn");

let app;
let server;
let tenantA;
let tenantB;
let memberWithSessions;
let memberWithNoSessions;
let memberExpired;
let staffA;
let staffB;

const loginUser = async (email, password, tenantSlug) => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password, tenantSlug });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
  expect(response.body.data.token).toBeTruthy();

  return response.body.data.token;
};

describe("Subscription and attendance check-in", () => {
  beforeAll(async () => {
    const serverInfo = await setupTestServer();
    app = serverInfo.app;
    server = serverInfo.server;
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeTestServer();
  });

  beforeEach(async () => {
    tenantA = await Tenant.create({
      name: "Sky Fitness",
      slug: "sky",
      email: "hello@skyfitness.com",
      status: "active",
      isActive: true,
    });

    tenantB = await Tenant.create({
      name: "Ocean Gym",
      slug: "ocean",
      email: "hello@oceangym.com",
      status: "active",
      isActive: true,
    });

    memberWithSessions = await User.create({
      name: "Active Member",
      email: "active@sky.com",
      password: "Password1!",
      role: "member",
      tenantId: tenantA._id,
      tenantSlug: tenantA.slug,
      isActive: true,
      subscription: {
        membershipType: "limited",
        remainingSessions: 5,
        status: "active",
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    memberWithNoSessions = await User.create({
      name: "No Sessions Member",
      email: "nosessions@sky.com",
      password: "Password1!",
      role: "member",
      tenantId: tenantA._id,
      tenantSlug: tenantA.slug,
      isActive: true,
      subscription: {
        membershipType: "limited",
        remainingSessions: 0,
        status: "active",
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    memberExpired = await User.create({
      name: "Expired Member",
      email: "expired@sky.com",
      password: "Password1!",
      role: "member",
      tenantId: tenantA._id,
      tenantSlug: tenantA.slug,
      isActive: true,
      subscription: {
        membershipType: "limited",
        remainingSessions: 5,
        status: "active",
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    staffA = await User.create({
      name: "Sky Owner",
      email: "owner@sky.com",
      password: "Password1!",
      role: "gymowner",
      tenantId: tenantA._id,
      tenantSlug: tenantA.slug,
      isActive: true,
    });

    staffB = await User.create({
      name: "Ocean Staff",
      email: "staff@ocean.com",
      password: "Password1!",
      role: "gymowner",
      tenantId: tenantB._id,
      tenantSlug: tenantB.slug,
      isActive: true,
    });
  });

  test("valid active subscription check-in decrements remaining sessions and records attendance", async () => {
    const token = await loginUser("active@sky.com", "Password1!", "sky");

    const response = await request(app)
      .post("/api/attendance/check-in")
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({ durationMinutes: 30, locationType: "gym" });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.checkIn).toBeDefined();
    expect(response.body.data.checkIn.status).toBe("checked_in");
    expect(response.body.data.checkIn.user).toBe(
      String(memberWithSessions._id),
    );

    const updatedMember = await User.findById(memberWithSessions._id);
    expect(updatedMember.subscription.remainingSessions).toBe(4);
    expect(updatedMember.attendanceHistory.length).toBe(1);
    expect(updatedMember.gamification.points).toBe(10);

    const checkInCount = await CheckIn.countDocuments({
      user: memberWithSessions._id,
      tenantId: tenantA._id,
    });
    expect(checkInCount).toBe(1);
  });

  test("check-in rejects when remaining sessions are zero", async () => {
    const token = await loginUser("nosessions@sky.com", "Password1!", "sky");

    const response = await request(app)
      .post("/api/attendance/check-in")
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({ durationMinutes: 30, locationType: "gym" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/expired or no sessions left/i);
  });

  test("check-in rejects when the subscription is expired", async () => {
    const token = await loginUser("expired@sky.com", "Password1!", "sky");

    const response = await request(app)
      .post("/api/attendance/check-in")
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({ durationMinutes: 30, locationType: "gym" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/expired or no sessions left/i);
  });

  test("tenant isolation blocks Tenant A staff from check-in actions for Tenant B", async () => {
    const token = await loginUser("owner@sky.com", "Password1!", "sky");

    const response = await request(app)
      .post("/api/attendance/check-in")
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "ocean")
      .send({ durationMinutes: 30, locationType: "gym" });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/access denied/i);

    const checkInCountB = await CheckIn.countDocuments({
      tenantId: tenantB._id,
    });
    expect(checkInCountB).toBe(0);
  });
});
