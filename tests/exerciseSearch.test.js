process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.JWT_SECRET = "test-secret-key";

jest.setTimeout(30000);

const request = require("supertest");
const GlobalExercise = require("../src/models/GlobalExercise");
const {
  setupTestServer,
  clearDatabase,
  closeTestServer,
} = require("./testServer");

beforeAll(async () => {
  await setupTestServer();
});

afterAll(async () => {
  await closeTestServer();
});

beforeEach(async () => {
  await clearDatabase();
});

describe("Global exercise search", () => {
  test("returns case-insensitive matches from both English and Arabic names", async () => {
    await GlobalExercise.create([
      {
        nameEn: "Barbell Bench Press",
        nameAr: "بنش برس بالبار مستوي",
        targetMuscle: "Chest",
        gifUrl: "https://example.com/bench.gif",
      },
      {
        nameEn: "Lat Pulldown",
        nameAr: "سحب ظهر واسع",
        targetMuscle: "Back",
        gifUrl: "https://example.com/pulldown.gif",
      },
      {
        nameEn: "Squat",
        nameAr: "سكوات",
        targetMuscle: "Legs",
        gifUrl: "https://example.com/squat.gif",
      },
    ]);

    const response = await request(
      await setupTestServer().then(({ app }) => app),
    )
      .get("/api/exercises/search?q=bench")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].nameEn).toBe("Barbell Bench Press");
    expect(response.body.data[0].nameAr).toBe("بنش برس بالبار مستوي");

    const arabicMatch = await request(
      await setupTestServer().then(({ app }) => app),
    )
      .get(`/api/exercises/search?q=${encodeURIComponent("سكوات")}`)
      .expect(200);

    expect(arabicMatch.body.success).toBe(true);
    expect(arabicMatch.body.data[0].nameEn).toBe("Squat");
  });

  test("limits results to 15 items", async () => {
    const exercises = Array.from({ length: 20 }, (_, index) => ({
      nameEn: `Test Exercise ${index + 1}`,
      nameAr: `تدريب ${index + 1}`,
      targetMuscle: "Core",
      gifUrl: `https://example.com/${index + 1}.gif`,
    }));

    await GlobalExercise.create(exercises);

    const response = await request(
      await setupTestServer().then(({ app }) => app),
    )
      .get("/api/exercises/search?q=Test")
      .expect(200);

    expect(response.body.data).toHaveLength(15);
  });
});
