jest.setTimeout(30000);

const request = require("supertest");
const {
  setupTestServer,
  clearDatabase,
  closeTestServer,
} = require("./testServer");
const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");
const { awardPoints } = require("../src/services/gamificationService");

let app;
let server;
let tenantA;
let tenantB;
let memberA;
let memberSilver;
let memberGold;
let trainerA;

const loginUser = async (email, password, tenantSlug) => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password, tenantSlug });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  return response.body.data.token;
};

const createActiveMember = async (tenant, email, name) => {
  return User.create({
    name,
    email,
    password: "Password1!",
    role: "member",
    tenantId: tenant._id,
    tenantSlug: tenant.slug,
    isActive: true,
    subscription: {
      membershipType: "limited",
      remainingSessions: 3,
      status: "active",
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
};

describe("Gamification engine and leaderboard behavior", () => {
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

    memberA = await createActiveMember(tenantA, "member@sky.com", "Member Sky");
    memberSilver = await createActiveMember(
      tenantA,
      "silver@sky.com",
      "Silver Sky",
    );
    memberGold = await createActiveMember(tenantA, "gold@sky.com", "Gold Sky");

    trainerA = await User.create({
      name: "Trainer Sky",
      email: "trainer@sky.com",
      password: "Password1!",
      role: "trainer",
      tenantId: tenantA._id,
      tenantSlug: tenantA.slug,
      isActive: true,
    });
  });

  test("attendance check-in awards 10 points to the member", async () => {
    const token = await loginUser("member@sky.com", "Password1!", "sky");

    const response = await request(app)
      .post("/api/attendance/check-in")
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky")
      .send({ durationMinutes: 30, locationType: "gym" });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.gamification.points).toBe(10);
  });

  test("class attendance awards 15 points to the present member", async () => {
    const trainerToken = await loginUser(
      "trainer@sky.com",
      "Password1!",
      "sky",
    );
    const memberToken = await loginUser("member@sky.com", "Password1!", "sky");

    const now = new Date();
    const classResponse = await request(app)
      .post("/api/trainer/classes")
      .set("Authorization", `Bearer ${trainerToken}`)
      .set("x-tenant-slug", "sky")
      .send({
        title: "Strength Training",
        capacity: 2,
        startTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      });

    expect(classResponse.status).toBe(201);
    const gymClass = classResponse.body.data;

    const enrollmentResponse = await request(app)
      .post(`/api/trainer/classes/${gymClass._id}/enroll`)
      .set("Authorization", `Bearer ${trainerToken}`)
      .set("x-tenant-slug", "sky")
      .send({ memberId: memberA._id.toString() });

    expect(enrollmentResponse.status).toBe(200);

    const attendanceResponse = await request(app)
      .patch(`/api/trainer/classes/${gymClass._id}/attendance`)
      .set("Authorization", `Bearer ${trainerToken}`)
      .set("x-tenant-slug", "sky")
      .send({ memberId: memberA._id.toString(), status: "present" });

    expect(attendanceResponse.status).toBe(200);
    expect(attendanceResponse.body.success).toBe(true);
    expect(attendanceResponse.body.data.attendanceRecord).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "present",
          memberId: expect.objectContaining({ _id: memberA._id.toString() }),
        }),
      ]),
    );

    const updatedMember = await User.findById(memberA._id);
    expect(updatedMember.gamification.points).toBe(15);
  });

  test("member rank advances to Silver at 501+ points and to Gold at 1501+ points", async () => {
    const silverUser = await awardPoints(
      memberSilver._id,
      tenantA._id,
      500,
      "Base points",
    );
    expect(silverUser.gamification.rank).toBe("Bronze");

    const promotedSilver = await awardPoints(
      memberSilver._id,
      tenantA._id,
      1,
      "Promotion bonus",
    );
    expect(promotedSilver.gamification.points).toBe(501);
    expect(promotedSilver.gamification.rank).toBe("Silver");

    const goldUser = await awardPoints(
      memberGold._id,
      tenantA._id,
      1500,
      "Base points",
    );
    expect(goldUser.gamification.rank).toBe("Silver");

    const promotedGold = await awardPoints(
      memberGold._id,
      tenantA._id,
      1,
      "Elite bonus",
    );
    expect(promotedGold.gamification.points).toBe(1501);
    expect(promotedGold.gamification.rank).toBe("Gold");
  });

  test("leaderboard endpoint returns members sorted by points and isolates tenant results", async () => {
    await awardPoints(memberA._id, tenantA._id, 100, "Points");
    await awardPoints(memberSilver._id, tenantA._id, 600, "Points");
    await awardPoints(memberGold._id, tenantA._id, 1600, "Points");

    const memberB = await createActiveMember(
      tenantB,
      "member@ocean.com",
      "Ocean Member",
    );
    await awardPoints(memberB._id, tenantB._id, 2000, "Points");

    const token = await loginUser("member@sky.com", "Password1!", "sky");
    const response = await request(app)
      .get("/api/members/leaderboard")
      .set("Authorization", `Bearer ${token}`)
      .set("x-tenant-slug", "sky");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(3);
    expect(response.body.data[0].email).toBe("gold@sky.com");
    expect(response.body.data[1].email).toBe("silver@sky.com");
    expect(response.body.data[2].email).toBe("member@sky.com");
    expect(
      response.body.data.every((row) => row.email.endsWith("@sky.com")),
    ).toBe(true);
  });
});
