process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.JWT_SECRET = "test-secret-key";

jest.setTimeout(30000);

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");
const Plan = require("../src/models/Plan");
const WorkoutLog = require("../src/models/WorkoutLog");

let mongoServer;
let app;
let server;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  const loaded = require("../server");
  app = loaded.app;
  server = loaded.server;

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once("open", resolve));
  }
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
});

describe("POST /api/member/log-workout", () => {
  test("creates a workout log for the current member and saves the completed session", async () => {
    const tenant = await Tenant.create({
      name: "Test Gym",
      slug: "test-gym",
      email: "owner@testgym.com",
      status: "active",
      isActive: true,
    });

    const member = await User.create({
      name: "Test Member",
      email: "member@testgym.com",
      password: "Password123!",
      role: "member",
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
      isActive: true,
    });

    const plan = await Plan.create({
      title: "Strength Starter",
      description: "A premium starter plan",
      exercises: [
        {
          name: "Back Squat",
          sets: 3,
          reps: "8",
          notes: "Focus on depth and control.",
        },
      ],
      dietNotes: [{ item: "Grilled chicken", alternatives: ["Turkey breast"] }],
      assignedTo: [member._id],
      createdBy: member._id,
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "member@testgym.com",
      password: "Password123!",
      tenantSlug: tenant.slug,
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.data.token;
    const completedAt = "2026-05-24T09:00:00.000Z";

    const response = await request(app)
      .post("/api/member/log-workout")
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", tenant.slug)
      .send({
        templateId: plan._id.toString(),
        completedAt,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/workout saved/i);

    const savedLog = await WorkoutLog.findOne({
      userId: member._id,
      tenantId: tenant._id,
    });

    expect(savedLog).toBeTruthy();
    expect(savedLog.sessionDate.toISOString()).toBe(completedAt);
    expect(savedLog.meta.templateId.toString()).toBe(plan._id.toString());
    expect(savedLog.exercises[0].name).toBe("Back Squat");
  });
});
