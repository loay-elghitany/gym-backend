process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.JWT_SECRET = "test-secret-key";

jest.setTimeout(30000);

const request = require("supertest");
const GlobalFood = require("../src/models/GlobalFood");
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

describe("Global food search", () => {
  test("returns case-insensitive matches from both English and Arabic names", async () => {
    await GlobalFood.create([
      {
        nameEn: "Chicken Breast",
        nameAr: "صدور دجاج",
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        baseUnit: "100g",
      },
      {
        nameEn: "Greek Yogurt",
        nameAr: "زبادي يوناني",
        calories: 59,
        protein: 10,
        carbs: 3.6,
        fats: 0.4,
        baseUnit: "100g",
      },
    ]);

    const englishMatch = await request(
      await setupTestServer().then(({ app }) => app),
    )
      .get("/api/foods/search?q=chicken")
      .expect(200);

    expect(englishMatch.body.success).toBe(true);
    expect(englishMatch.body.data[0].nameEn).toBe("Chicken Breast");

    const arabicMatch = await request(
      await setupTestServer().then(({ app }) => app),
    )
      .get(`/api/foods/search?q=${encodeURIComponent("زبادي")}`)
      .expect(200);

    expect(arabicMatch.body.success).toBe(true);
    expect(arabicMatch.body.data[0].nameAr).toBe("زبادي يوناني");
  });

  test("limits results to 15 items", async () => {
    const foods = Array.from({ length: 20 }, (_, index) => ({
      nameEn: `Food ${index + 1}`,
      nameAr: `غذاء ${index + 1}`,
      calories: 100,
      protein: 10,
      carbs: 20,
      fats: 5,
      baseUnit: "100g",
    }));

    await GlobalFood.create(foods);

    const response = await request(
      await setupTestServer().then(({ app }) => app),
    )
      .get("/api/foods/search?q=Food")
      .expect(200);

    expect(response.body.data).toHaveLength(15);
  });
});
