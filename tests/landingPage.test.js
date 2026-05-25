process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.JWT_SECRET = "test-secret-key";

jest.setTimeout(30000);

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");

let mongoServer;
let app;
let server;
let testTenant;
let ownerUser;

const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");
const MembershipPackage = require("../src/models/MembershipPackage");

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  const loaded = require("../server");
  app = loaded.app;
  server = loaded.server;

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
    name: "Peak Motion",
    slug: "peak-motion",
    email: "owner@peakmotion.com",
    status: "active",
    isActive: true,
    landingPageConfig: {
      heroTitle: "Train with purpose",
      heroSubtitle: "A sharper, stronger gym experience.",
      aboutText: "Premium strength and performance coaching.",
      themeColor: "#0f172a",
      isActive: false,
    },
  });

  ownerUser = await User.create({
    name: "Owner",
    email: "owner@peakmotion.com",
    password: "Password123!",
    role: "gymowner",
    tenantId: testTenant._id,
    tenantSlug: testTenant.slug,
    isActive: true,
  });

  await MembershipPackage.create({
    name: "Starter",
    price: 29,
    durationInDays: 30,
    sessionCount: 10,
    tenantId: testTenant._id,
    tenantSlug: testTenant.slug,
    isActive: true,
  });

  await MembershipPackage.create({
    name: "Elite",
    price: 69,
    durationInDays: 90,
    sessionCount: 20,
    tenantId: testTenant._id,
    tenantSlug: testTenant.slug,
    isActive: true,
  });
});

describe("landing page APIs", () => {
  test("should return landing page data and active plans for a public tenant route", async () => {
    const response = await request(app).get("/api/landing/peak-motion");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.gymName).toBe("Peak Motion");
    expect(response.body.data.landingPageConfig.heroTitle).toBe(
      "Train with purpose",
    );
    expect(response.body.data.landingPageConfig.isActive).toBe(false);
    expect(response.body.data.plans).toHaveLength(2);
  });

  test("should reject updates to landing config without authorization", async () => {
    const response = await request(app)
      .put("/api/gym/landing-config")
      .set("x-tenant-slug", testTenant.slug)
      .send({ heroTitle: "Updated title" });

    expect(response.status).toBe(401);
  });

  test("should update landing page config for the authenticated gym owner", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "owner@peakmotion.com",
      password: "Password123!",
      tenantSlug: testTenant.slug,
    });

    const response = await request(app)
      .put("/api/gym/landing-config")
      .set("Authorization", `Bearer ${login.body.data.token}`)
      .set("x-tenant-slug", testTenant.slug)
      .send({
        heroTitle: "New title",
        themeColor: "#1d4ed8",
        isActive: true,
        galleryUrls: ["https://cdn.example.com/a.jpg"],
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.heroTitle).toBe("New title");
    expect(response.body.data.themeColor).toBe("#1d4ed8");
    expect(response.body.data.isActive).toBe(true);
    expect(response.body.data.galleryUrls).toEqual([
      "https://cdn.example.com/a.jpg",
    ]);

    const updatedTenant = await Tenant.findById(testTenant._id);
    expect(updatedTenant.landingPageConfig.heroTitle).toBe("New title");
    expect(updatedTenant.landingPageConfig.isActive).toBe(true);
  });
});
