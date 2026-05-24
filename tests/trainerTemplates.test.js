process.env.NODE_ENV = "test";

jest.setTimeout(30000);

const request = require("supertest");
const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");
const PlanTemplate = require("../src/models/PlanTemplate");
const {
  setupTestServer,
  clearDatabase,
  closeTestServer,
} = require("./testServer");

let app;
let tenant;
let trainerUser;
let trainerToken;

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
    name: "Trainer Test Gym",
    slug: "trainer-test-gym",
    email: "trainer@testgym.com",
    status: "active",
    isActive: true,
  });

  trainerUser = await User.create({
    name: "Trainer",
    email: "trainer@testgym.com",
    password: "Password123!",
    role: "trainer",
    tenantId: tenant._id,
    tenantSlug: tenant.slug,
    isActive: true,
  });

  const loginResponse = await request(app).post("/api/auth/login").send({
    email: "trainer@testgym.com",
    password: "Password123!",
    tenantSlug: tenant.slug,
  });

  trainerToken = loginResponse.body.data.token;
});

describe("trainer template endpoints", () => {
  test("should create a template even when exercises is an empty array", async () => {
    const response = await request(app)
      .post("/api/trainer/templates")
      .set("Authorization", `Bearer ${trainerToken}`)
      .set("x-tenant-slug", tenant.slug)
      .send({
        templateName: "Empty Template",
        exercises: [],
        meals: [],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.exercises).toEqual([]);
    expect(response.body.data.meals).toEqual([]);
  });

  test("should accept string diet notes and filter empty exercise rows", async () => {
    const response = await request(app)
      .post("/api/trainer/templates")
      .set("Authorization", `Bearer ${trainerToken}`)
      .set("x-tenant-slug", tenant.slug)
      .send({
        templateName: "Meal Note Template",
        exercises: [
          {
            name: "Push-up",
            sets: "3",
            reps: "12",
            notes: "",
          },
          {
            name: "",
            sets: "",
            reps: "",
            notes: "",
          },
        ],
        meals: ["Chicken Bowl", "", "Rice"],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.exercises).toEqual([
      {
        name: "Push-up",
        sets: 3,
        reps: "12",
        notes: "",
      },
    ]);
    expect(response.body.data.meals).toEqual([
      {
        mealName: "Chicken Bowl",
        description: "",
      },
      {
        mealName: "Rice",
        description: "",
      },
    ]);
  });

  test("should replace the full exercises array on update", async () => {
    const template = await PlanTemplate.create({
      templateName: "Original Template",
      exercises: [
        {
          name: "Bench Press",
          sets: 3,
          reps: "10",
          notes: "Warm-up",
        },
        {
          name: "Deadlift",
          sets: 4,
          reps: "8",
          notes: "Core focus",
        },
      ],
      meals: [{ mealName: "Protein shake", description: "Post-workout" }],
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
      createdByTrainerId: trainerUser._id,
    });

    const response = await request(app)
      .put(`/api/trainer/templates/${template._id}`)
      .set("Authorization", `Bearer ${trainerToken}`)
      .set("x-tenant-slug", tenant.slug)
      .send({
        templateName: "Updated Template",
        exercises: [
          {
            name: "Squat",
            sets: 5,
            reps: "5",
            notes: "Heavy",
          },
          {
            name: "",
            sets: 0,
            reps: "",
            notes: "",
          },
        ],
        meals: ["Salad", ""],
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.templateName).toBe("Updated Template");
    expect(response.body.data.exercises).toEqual([
      {
        name: "Squat",
        sets: 5,
        reps: "5",
        notes: "Heavy",
      },
    ]);
    expect(response.body.data.meals).toEqual([
      {
        mealName: "Salad",
        description: "",
      },
    ]);

    const savedTemplate = await PlanTemplate.findById(template._id).lean();
    expect(savedTemplate.exercises).toHaveLength(1);
    expect(savedTemplate.exercises[0].name).toBe("Squat");
    expect(savedTemplate.meals).toEqual([
      {
        mealName: "Salad",
        description: "",
      },
    ]);
  });
});
