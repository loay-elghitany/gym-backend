jest.setTimeout(30000);

const request = require("supertest");
const {
  setupTestServer,
  clearDatabase,
  closeTestServer,
} = require("./testServer");
const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");
const GymClass = require("../src/models/GymClass");

let app;
let server;
let tenantA;
let tenantB;
let trainerA;
let memberA;
let memberB;
let classA;

const loginUser = async (email, password, tenantSlug) => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password, tenantSlug });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  return response.body.data.token;
};

const createClass = async (token, tenantSlug, overrides = {}) => {
  const now = new Date();
  const payload = {
    title: overrides.title || "Pilates Foundation",
    capacity: overrides.capacity || 1,
    startTime:
      overrides.startTime ||
      new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    endTime:
      overrides.endTime ||
      new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
  };

  const response = await request(app)
    .post("/api/trainer/classes")
    .set("Authorization", `Bearer ${token}`)
    .set("x-tenant-slug", tenantSlug)
    .send(payload);

  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
  return response.body.data;
};

describe("Class scheduling and roster management", () => {
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

    trainerA = await User.create({
      name: "Trainer Sky",
      email: "trainer@sky.com",
      password: "Password1!",
      role: "trainer",
      tenantId: tenantA._id,
      tenantSlug: tenantA.slug,
      isActive: true,
    });

    memberA = await User.create({
      name: "Class Member Sky",
      email: "member@sky.com",
      password: "Password1!",
      role: "member",
      tenantId: tenantA._id,
      tenantSlug: tenantA.slug,
      isActive: true,
    });

    memberB = await User.create({
      name: "Class Member Ocean",
      email: "member@ocean.com",
      password: "Password1!",
      role: "member",
      tenantId: tenantB._id,
      tenantSlug: tenantB.slug,
      isActive: true,
    });
  });

  test("trainer can create a new class with title, capacity, and startTime", async () => {
    const token = await loginUser("trainer@sky.com", "Password1!", "sky");
    const response = await request(app)
      .post("/api/trainer/classes")
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({
        title: "Morning Spin",
        capacity: 12,
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe("Morning Spin");
    expect(response.body.data.capacity).toBe(12);
    expect(new Date(response.body.data.startTime).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  test("trainer cannot enroll a member when class capacity has already been reached", async () => {
    const token = await loginUser("trainer@sky.com", "Password1!", "sky");
    const createdClass = await createClass(token, "sky", { capacity: 1 });

    const firstEnrollment = await request(app)
      .post(`/api/trainer/classes/${createdClass._id}/enroll`)
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({ memberId: memberA._id.toString() });

    expect(firstEnrollment.status).toBe(200);
    expect(firstEnrollment.body.success).toBe(true);

    const secondMember = await User.create({
      name: "Second Sky Member",
      email: "member2@sky.com",
      password: "Password1!",
      role: "member",
      tenantId: tenantA._id,
      tenantSlug: tenantA.slug,
      isActive: true,
    });

    const secondEnrollment = await request(app)
      .post(`/api/trainer/classes/${createdClass._id}/enroll`)
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({ memberId: secondMember._id.toString() });

    expect(secondEnrollment.status).toBe(400);
    expect(secondEnrollment.body.success).toBe(false);
    expect(secondEnrollment.body.message).toMatch(/fully booked/i);
  });

  test("marking a class attendance status updates the attendanceRecord array correctly", async () => {
    const token = await loginUser("trainer@sky.com", "Password1!", "sky");
    const createdClass = await createClass(token, "sky", { capacity: 2 });

    const enrollResponse = await request(app)
      .post(`/api/trainer/classes/${createdClass._id}/enroll`)
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({ memberId: memberA._id.toString() });

    expect(enrollResponse.status).toBe(200);
    expect(enrollResponse.body.success).toBe(true);

    const attendanceResponse = await request(app)
      .patch(`/api/trainer/classes/${createdClass._id}/attendance`)
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({ memberId: memberA._id.toString(), status: "present" });

    expect(attendanceResponse.status).toBe(200);
    expect(attendanceResponse.body.success).toBe(true);

    const attendanceRecord = attendanceResponse.body.data.attendanceRecord.find(
      (record) => record.memberId._id === memberA._id.toString(),
    );
    expect(attendanceRecord).toBeDefined();
    expect(attendanceRecord.status).toBe("present");
    expect(new Date(attendanceRecord.updatedAt).getTime()).toBeGreaterThan(0);

    const absentResponse = await request(app)
      .patch(`/api/trainer/classes/${createdClass._id}/attendance`)
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({ memberId: memberA._id.toString(), status: "absent" });

    expect(absentResponse.status).toBe(200);
    expect(absentResponse.body.success).toBe(true);
    const updatedRecord = absentResponse.body.data.attendanceRecord.find(
      (record) => record.memberId._id === memberA._id.toString(),
    );
    expect(updatedRecord.status).toBe("absent");
  });

  test("tenant isolation prevents trainer from accessing classes for a different tenant", async () => {
    const token = await loginUser("trainer@sky.com", "Password1!", "sky");

    const response = await request(app)
      .get("/api/trainer/classes")
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "ocean");

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/access denied/i);
  });

  test("tenant isolation blocks member enrollment using a member from a different tenant", async () => {
    const token = await loginUser("trainer@sky.com", "Password1!", "sky");
    const createdClass = await createClass(token, "sky", { capacity: 2 });

    const response = await request(app)
      .post(`/api/trainer/classes/${createdClass._id}/enroll`)
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({ memberId: memberB._id.toString() });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/member not found in this tenant/i);
  });
});
