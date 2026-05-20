require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/database");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const Membership = require("../models/Membership");

const seedData = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for seeding...");

    console.log("Clearing existing Tenant, User, and Membership data...");
    await Promise.all([
      Tenant.deleteMany({}),
      User.deleteMany({}),
      Membership.deleteMany({}),
    ]);

    const tenant = await Tenant.create({
      name: "Power Gym",
      slug: "power-gym",
      email: "info@powergym.com",
      phone: "+971-555-123-456",
      address: {
        street: "123 Power Avenue",
        city: "Dubai",
        state: "DU",
        zipCode: "00000",
        country: "UAE",
      },
      subscriptionStatus: "active",
      subscriptionPlan: "enterprise",
      maxMembers: 500,
      maxTrainers: 50,
      isActive: true,
    });

    console.log(`Created tenant: ${tenant.name} (${tenant.slug})`);

    const gymOwnerPassword = await bcrypt.hash("Loay@1234", 10);
    const gymOwner = await User.create({
      name: "loay Ahmed",
      email: "elghitany@powergym.com",
      password: gymOwnerPassword,
      role: "gymowner",
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
      phone: "+201090748215",
      isActive: true,
      permissions: [
        "manage_members",
        "manage_trainers",
        "manage_classes",
        "manage_billing",
        "view_reports",
        "manage_tenant",
      ],
      healthProfile: {
        injuries: ["lower back strain"],
        inBodyHistory: [
          {
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            weight: 89,
            bodyFatPercentage: 18,
            muscleMass: 72,
            visceralFat: 10,
            bodyWaterPercentage: 55,
          },
        ],
      },
      gamification: {
        attendanceStreak: 12,
        points: 1200,
        badges: [
          {
            name: "Leadership Champion",
            description:
              "High-impact gym management with active member engagement",
          },
        ],
      },
      attendanceHistory: [
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          checkInType: "gym",
        },
      ],
      lastAttendanceAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    console.log(`Created gym owner: ${gymOwner.email}`);

    const membershipPlans = [
      {
        name: "Basic",
        description:
          "Entry-level membership with access to gym equipment and locker rooms.",
        price: 29.99,
        currency: "USD",
        duration: 1,
        durationUnit: "months",
        features: ["Gym access", "Locker room", "Access to group classes"],
        billingCycle: "monthly",
        maxClassesPerWeek: 3,
        accessToEquipment: true,
        accessToPersonalTrainer: false,
        isActive: true,
        displayOrder: 1,
      },
      {
        name: "Pro",
        description:
          "Advanced plan with personal training sessions and premium support.",
        price: 59.99,
        currency: "USD",
        duration: 1,
        durationUnit: "months",
        features: [
          "Gym access",
          "Locker room",
          "Unlimited classes",
          "2 personal training sessions",
        ],
        billingCycle: "monthly",
        maxClassesPerWeek: 5,
        accessToEquipment: true,
        accessToPersonalTrainer: true,
        isActive: true,
        displayOrder: 2,
      },
      {
        name: "VIP",
        description:
          "Full VIP experience with unlimited coaching, nutrition support, and premium amenities.",
        price: 99.99,
        currency: "USD",
        duration: 1,
        durationUnit: "months",
        features: [
          "Gym access",
          "Unlimited classes",
          "Unlimited personal training",
          "Nutrition coaching",
          "Spa access",
        ],
        billingCycle: "monthly",
        maxClassesPerWeek: null,
        accessToEquipment: true,
        accessToPersonalTrainer: true,
        isActive: true,
        displayOrder: 3,
      },
    ];

    await Membership.insertMany(
      membershipPlans.map((plan) => ({
        ...plan,
        tenantId: tenant._id,
        tenantSlug: tenant.slug,
      })),
    );

    console.log("Created 3 membership plans for power-gym.");

    const trainers = [
      {
        name: "Rami Al-Farsi",
        email: "rami.trainer@powergym.com",
        role: "trainer",
        phone: "+971-555-000-002",
      },
      {
        name: "Mona Hassan",
        email: "mona.trainer@powergym.com",
        role: "trainer",
        phone: "+971-555-000-003",
      },
      {
        name: "Omar Khalid",
        email: "omar.trainer@powergym.com",
        role: "trainer",
        phone: "+971-555-000-004",
      },
    ];

    const memberNames = [
      "Adam Saleh",
      "Nadia Ali",
      "Omar Youssef",
      "Sara Nasser",
      "Tariq Jaber",
      "Mariam Saeed",
      "Zaid Hamdan",
      "Layla Farouk",
      "Faisal Karim",
      "Nada Ibrahim",
      "Yasmin Khaled",
      "Khalid Hamdi",
      "Hana Yunus",
      "Rana Mustafa",
      "Ali Hassan",
      "Nour Hamed",
      "Kareem Adel",
      "Latifa Omar",
    ];

    const trainerUsers = await Promise.all(
      trainers.map(async (trainer, index) => {
        const password = await bcrypt.hash("12345678", 10);
        const attendanceDate = new Date(
          Date.now() - (index + 1) * 24 * 60 * 60 * 1000,
        );
        return {
          name: trainer.name,
          email: trainer.email,
          password,
          role: trainer.role,
          tenantId: tenant._id,
          tenantSlug: tenant.slug,
          phone: trainer.phone,
          isActive: true,
          attendanceHistory: [
            {
              date: attendanceDate,
              checkInType: "training",
            },
          ],
          lastAttendanceAt: attendanceDate,
          gamification: {
            attendanceStreak: 3,
            points: 250,
            badges: [
              {
                name: "Early Riser",
                description: "Consistent trainer availability before 7 AM",
              },
            ],
          },
        };
      }),
    );

    const memberUsers = await Promise.all(
      memberNames.map(async (name, index) => {
        const password = await bcrypt.hash("12345678", 10);
        const email = `${name
          .toLowerCase()
          .replace(/\s+/g, ".")}.member@powergym.com`;
        const lastAttendanceDays = index % 7 === 0 ? null : (index % 15) + 1;
        const lastAttendanceAt = lastAttendanceDays
          ? new Date(Date.now() - lastAttendanceDays * 24 * 60 * 60 * 1000)
          : null;

        return {
          name,
          email,
          password,
          role: "member",
          tenantId: tenant._id,
          tenantSlug: tenant.slug,
          phone: `+971-555-00${(10 + index).toString().padStart(2, "0")}`,
          isActive: true,
          attendanceHistory: lastAttendanceAt
            ? [
                {
                  date: lastAttendanceAt,
                  checkInType: "gym",
                },
              ]
            : [],
          lastAttendanceAt,
          gamification: {
            attendanceStreak: lastAttendanceAt
              ? Math.max(0, 5 - (index % 4))
              : 0,
            points: 100 + index * 10,
            badges: lastAttendanceAt
              ? [
                  {
                    name: "Consistent Attender",
                    description:
                      "Attended the gym at least once in the last 15 days",
                  },
                ]
              : [],
          },
        };
      }),
    );

    await User.insertMany([...trainerUsers, ...memberUsers]);

    console.log(
      `Created ${trainerUsers.length} trainers and ${memberUsers.length} members for power-gym.`,
    );
    console.log(
      "Seeding complete. Your database is ready for frontend integration.",
    );
    console.log("Gym Owner credentials: elghitany@powergym.com / Loay@1234");
    process.exit(0);
  } catch (error) {
    console.error("Seeder error:", error);
    process.exit(1);
  }
};

seedData();
