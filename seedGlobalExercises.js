require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./src/config/database");
const GlobalExercise = require("./src/models/GlobalExercise");

const exercises = [
  {
    nameEn: "Barbell Bench Press",
    nameAr: "بنش برس بالبار مستوي",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/l0MYv58nvs4EtzMFy/giphy.gif",
  },
  {
    nameEn: "Incline Dumbbell Press",
    nameAr: "بنش برس بالدمبل مائل",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Chest Fly",
    nameAr: "فلاي صدر",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt6mM4jgmQgLJ2M/giphy.gif",
  },
  {
    nameEn: "Push-Up",
    nameAr: "تمرين ضغط",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt3zqug9F8x7K4E/giphy.gif",
  },
  {
    nameEn: "Lat Pulldown",
    nameAr: "سحب ظهر واسع",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1M9aG94NQJm1O/giphy.gif",
  },
  {
    nameEn: "Bent-Over Row",
    nameAr: "سحب بالبار من وضع الانحناء",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o6Zs4PSJiq1f8nF5W/giphy.gif",
  },
  {
    nameEn: "Seated Cable Row",
    nameAr: "سحب كابل جالس",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1Vd1AqjP4dXr2/giphy.gif",
  },
  {
    nameEn: "Deadlift",
    nameAr: "ديفلِفت",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD7h4jEO9U0sOrK/giphy.gif",
  },
  {
    nameEn: "Pull-Up",
    nameAr: "سحب علوي",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD88Nsxq8S3Tj8Q/giphy.gif",
  },
  {
    nameEn: "Face Pull",
    nameAr: "سحب وجه",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD2fXjAghTGgk9K/giphy.gif",
  },
  {
    nameEn: "Overhead Press",
    nameAr: "دفع فوق الراس",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o6Zs5ET3OaLq8iA1W/giphy.gif",
  },
  {
    nameEn: "Lateral Raise",
    nameAr: "رفع جانبي",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },
  {
    nameEn: "Front Raise",
    nameAr: "رفع أمامي",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5lS6Qv1rYZQwE/giphy.gif",
  },
  {
    nameEn: "Squat",
    nameAr: "سكوات",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Romanian Deadlift",
    nameAr: "ديفلِفت روماني",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD23Z0L0fX5oRAY/giphy.gif",
  },
  {
    nameEn: "Leg Press",
    nameAr: "ضغط أرجل",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o6Zs4L2lUoGgk3rWw/giphy.gif",
  },
  {
    nameEn: "Walking Lunge",
    nameAr: "لغات مشي",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD5WB6zMa0jWwj6/giphy.gif",
  },
  {
    nameEn: "Bulgarian Split Squat",
    nameAr: "سكوات تقسيم بلغاري",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD4qlxWbELC7z5O/giphy.gif",
  },
  {
    nameEn: "Hip Thrust",
    nameAr: "دفع الورك",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7mLQ5M3lO2P4M/giphy.gif",
  },
  {
    nameEn: "Calf Raise",
    nameAr: "رفع الساق",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD2Bf2h5m6w4o4E/giphy.gif",
  },
  {
    nameEn: "Biceps Curl",
    nameAr: "تمرين بيسبس بالكابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Triceps Pushdown",
    nameAr: "سحب ثلاثي الرأس",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD3M0M8cY3E7A9K/giphy.gif",
  },
  {
    nameEn: "Hammer Curl",
    nameAr: "كيرل المطرقة",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD6HY4OWcl7FQ5C/giphy.gif",
  },
  {
    nameEn: "Close-Grip Push-Up",
    nameAr: "ضغط ضيق اليدين",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD5cL5A6t0K5g5E/giphy.gif",
  },
  {
    nameEn: "Cable Triceps Extension",
    nameAr: "تمديد ثلاثي الرأس بالكابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD9s4VYfQ2LQb0I/giphy.gif",
  },
  {
    nameEn: "Reverse Curl",
    nameAr: "كيرل معكوس",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD5l4cQgn8KJ9S0/giphy.gif",
  },
  {
    nameEn: "Plank",
    nameAr: "بلانك",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD3i5tWbmIafVEA/giphy.gif",
  },
  {
    nameEn: "Dead Bug",
    nameAr: "دبغ باج",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD4hc4G1aS0N8I8/giphy.gif",
  },
  {
    nameEn: "Cable Woodchop",
    nameAr: "قطع خشب بالكابل",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD7GqFzfZ4f7M4M/giphy.gif",
  },
  {
    nameEn: "Russian Twist",
    nameAr: "التواء روسي",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD97W6nM7dRSe24/giphy.gif",
  },
  {
    nameEn: "Hanging Knee Raise",
    nameAr: "رفع الركبة مع تعليق",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD7Yq6x9l1w0svK/giphy.gif",
  },
  {
    nameEn: "Bird Dog",
    nameAr: "كلب الطير",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD1cW7m1lQY4Vek/giphy.gif",
  },
  {
    nameEn: "Farmer's Carry",
    nameAr: "حمل الحبوب",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD3eUeSSN2L2FX2/giphy.gif",
  },
  {
    nameEn: "Glute Bridge",
    nameAr: "جسر الأرداف",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD38Rwyj1S7c22Y/giphy.gif",
  },
  {
    nameEn: "Single-Leg Deadlift",
    nameAr: "ديفلِفت رجل واحدة",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD9j1b9M9NwR7r2/giphy.gif",
  },
  {
    nameEn: "Step-Up",
    nameAr: "رفع خطوة",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD8U92N3YQ8qPAA/giphy.gif",
  },
  {
    nameEn: "Cable Face Pull",
    nameAr: "سحب وجه بالكابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD52qM6YVZH6v4M/giphy.gif",
  },
  {
    nameEn: "Dumbbell Shoulder Press",
    nameAr: "دفع كتف بالدمبل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD0f3Yp0J2L8nTE/giphy.gif",
  },
  {
    nameEn: "Reverse Fly",
    nameAr: "فلاي عكسي",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD3r6zNw0m7w0Re/giphy.gif",
  },
  {
    nameEn: "Single-Arm Row",
    nameAr: "سحب ذراع واحدة",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD5382SY8F26cMw/giphy.gif",
  },
  {
    nameEn: "Concentration Curl",
    nameAr: "كيرل تركيز",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD7v7wqA4xkVhH2/giphy.gif",
  },
  {
    nameEn: "Cable Crunch",
    nameAr: "انقباض بطن بالكابل",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD3xO11GX7s6gVq/giphy.gif",
  },
  {
    nameEn: "Pike Push-Up",
    nameAr: "ضغط بيك",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD3n8i7V4ZVtgD6/giphy.gif",
  },
  {
    nameEn: "Dips",
    nameAr: "دبسة",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD7mV5p0wN4rUjK/giphy.gif",
  },
  {
    nameEn: "Kettlebell Swing",
    nameAr: "سويت كيتلبيل",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD9I7V5oP2s1L4Q/giphy.gif",
  },
  {
    nameEn: "Medicine Ball Slam",
    nameAr: "ضرب الكرة الطبية",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD9a1cN9zAq7lA0/giphy.gif",
  },
  {
    nameEn: "Smith Machine Squat",
    nameAr: "سكوات ماكينة سميث",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD72M6F0uHHtB0I/giphy.gif",
  },
  {
    nameEn: "Pullover",
    nameAr: "بولوفر",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD4J3xWoH2RU949/giphy.gif",
  },
  {
    nameEn: "Cable Chest Fly",
    nameAr: "فلاي صدر بالكابل",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD5X4r0P9xK0mQ8/giphy.gif",
  },
  {
    nameEn: "Incline Cable Row",
    nameAr: "سحب كابل مائل",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD68fS7T9vYv0P2/giphy.gif",
  },
];

const seed = async () => {
  try {
    await connectDB();
    await GlobalExercise.deleteMany({});
    await GlobalExercise.insertMany(exercises);
    console.log(`✓ Seeded ${exercises.length} global exercises successfully.`);
  } catch (error) {
    console.error("✗ Failed to seed global exercises:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();
