require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const connectDB = require("./src/config/database");
const GlobalExercise = require("./src/models/GlobalExercise");

const exercises = [
  // --- Chest (الصدر) ---
  {
    nameEn: "Barbell Bench Press",
    nameAr: "بنش برس بالبار مستوي",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/l0MYv58nvs4EtzMFy/giphy.gif",
  },
  {
    nameEn: "Incline Barbell Press",
    nameAr: "بنش برس بالبار عالي",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Decline Barbell Press",
    nameAr: "بنش برس بالبار مقلوب",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt6mM4jgmQgLJ2M/giphy.gif",
  },
  {
    nameEn: "Flat Dumbbell Press",
    nameAr: "تجميع دنابل مستوي",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Incline Dumbbell Press",
    nameAr: "تجميع دنابل عالي",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Decline Dumbbell Press",
    nameAr: "تجميع دنابل مقلوب",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Flat Dumbbell Fly",
    nameAr: "تفتيح دنابل مستوي",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt6mM4jgmQgLJ2M/giphy.gif",
  },
  {
    nameEn: "Incline Dumbbell Fly",
    nameAr: "تفتيح دنابل عالي",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt6mM4jgmQgLJ2M/giphy.gif",
  },
  {
    nameEn: "Cable Crossover",
    nameAr: "تفتيح كابل كروس",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt3zqug9F8x7K4E/giphy.gif",
  },
  {
    nameEn: "Low Cable Crossover",
    nameAr: "تفتيح كابل كروس سفلي (عالي)",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt3zqug9F8x7K4E/giphy.gif",
  },
  {
    nameEn: "Pec Deck Fly",
    nameAr: "تفتيح على جهاز الفراشة",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt6mM4jgmQgLJ2M/giphy.gif",
  },
  {
    nameEn: "Machine Chest Press",
    nameAr: "دفع صدر على الجهاز",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Dumbbell Pullover",
    nameAr: "بولوفر دنابل",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD4J3xWoH2RU949/giphy.gif",
  },
  {
    nameEn: "Push-Up",
    nameAr: "تمرين ضغط",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt3zqug9F8x7K4E/giphy.gif",
  },
  {
    nameEn: "Chest Dips",
    nameAr: "متوازي (تركيز صدر)",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD7mV5p0wN4rUjK/giphy.gif",
  },

  // --- Back (الظهر) ---
  {
    nameEn: "Lat Pulldown Wide",
    nameAr: "سحب ظهر عالي واسع",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1M9aG94NQJm1O/giphy.gif",
  },
  {
    nameEn: "Lat Pulldown Close",
    nameAr: "سحب ظهر عالي ضيق (قبضة V)",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1M9aG94NQJm1O/giphy.gif",
  },
  {
    nameEn: "Lat Pulldown Reverse Grip",
    nameAr: "سحب ظهر عالي مقلوب",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1M9aG94NQJm1O/giphy.gif",
  },
  {
    nameEn: "Seated Cable Row",
    nameAr: "سحب أرضي بالكابل",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1Vd1AqjP4dXr2/giphy.gif",
  },
  {
    nameEn: "Machine Row",
    nameAr: "سحب أرضي على الجهاز",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1Vd1AqjP4dXr2/giphy.gif",
  },
  {
    nameEn: "Barbell Bent-Over Row",
    nameAr: "سحب ظهر بالبار (طرمبة)",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o6Zs4PSJiq1f8nF5W/giphy.gif",
  },
  {
    nameEn: "T-Bar Row",
    nameAr: "سحب ظهر جهاز (تي بار)",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o6Zs4PSJiq1f8nF5W/giphy.gif",
  },
  {
    nameEn: "Dumbbell Row",
    nameAr: "سحب ضهر بالدمبل (منشار)",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o6Zs4PSJiq1f8nF5W/giphy.gif",
  },
  {
    nameEn: "Straight Arm Pulldown",
    nameAr: "سحب ضهر مفرود بالكابل",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1M9aG94NQJm1O/giphy.gif",
  },
  {
    nameEn: "Deadlift",
    nameAr: "رفعة مميتة (ديدلِفت)",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD7h4jEO9U0sOrK/giphy.gif",
  },
  {
    nameEn: "Rack Pull",
    nameAr: "ديدلفت جزئي (راك بول)",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD7h4jEO9U0sOrK/giphy.gif",
  },
  {
    nameEn: "Pull-Up",
    nameAr: "عقلة واسع",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD88Nsxq8S3Tj8Q/giphy.gif",
  },
  {
    nameEn: "Chin-Up",
    nameAr: "عقلة ضيق (مقلوب)",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD88Nsxq8S3Tj8Q/giphy.gif",
  },
  {
    nameEn: "Good Mornings",
    nameAr: "جود مورنينج (قطنية بالبار)",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD7h4jEO9U0sOrK/giphy.gif",
  },
  {
    nameEn: "Back Extension",
    nameAr: "قطنية على الجهاز",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD7h4jEO9U0sOrK/giphy.gif",
  },

  // --- Shoulders (الكتف) ---
  {
    nameEn: "Dumbbell Shoulder Press",
    nameAr: "تجميع كتف بالدنابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD0f3Yp0J2L8nTE/giphy.gif",
  },
  {
    nameEn: "Barbell Overhead Press",
    nameAr: "دفع كتف أمامي بالبار",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o6Zs5ET3OaLq8iA1W/giphy.gif",
  },
  {
    nameEn: "Behind the Neck Press",
    nameAr: "دفع كتف خلفي بالبار",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o6Zs5ET3OaLq8iA1W/giphy.gif",
  },
  {
    nameEn: "Arnold Press",
    nameAr: "تجميع كتف أرنولد",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD0f3Yp0J2L8nTE/giphy.gif",
  },
  {
    nameEn: "Machine Shoulder Press",
    nameAr: "دفع كتف على الجهاز",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD0f3Yp0J2L8nTE/giphy.gif",
  },
  {
    nameEn: "Lateral Raise",
    nameAr: "رفرفة جانبي دنابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },
  {
    nameEn: "Cable Lateral Raise",
    nameAr: "رفرفة جانبي بالكابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },
  {
    nameEn: "Front Raise Dumbbell",
    nameAr: "رفرفة أمامي دنابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5lS6Qv1rYZQwE/giphy.gif",
  },
  {
    nameEn: "Front Raise Barbell",
    nameAr: "رفرفة أمامي بالبار",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5lS6Qv1rYZQwE/giphy.gif",
  },
  {
    nameEn: "Front Raise Plate",
    nameAr: "رفرفة أمامي بطارة",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5lS6Qv1rYZQwE/giphy.gif",
  },
  {
    nameEn: "Reverse Pec Deck",
    nameAr: "رفرفة خلفي على الجهاز",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD3r6zNw0m7w0Re/giphy.gif",
  },
  {
    nameEn: "Dumbbell Reverse Fly",
    nameAr: "رفرفة خلفي دنابل (من الانحناء)",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD3r6zNw0m7w0Re/giphy.gif",
  },
  {
    nameEn: "Face Pull",
    nameAr: "سحب وجه بالكابل (خلفي)",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD2fXjAghTGgk9K/giphy.gif",
  },
  {
    nameEn: "Upright Row Barbell",
    nameAr: "سحب دقن بالبار",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },
  {
    nameEn: "Upright Row Cable",
    nameAr: "سحب دقن بالكابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },
  {
    nameEn: "Barbell Shrugs",
    nameAr: "ترابيس بالبار",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },
  {
    nameEn: "Dumbbell Shrugs",
    nameAr: "ترابيس بالدنابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },

  // --- Legs (الرجل) ---
  {
    nameEn: "Barbell Squat",
    nameAr: "سكوات حر بالبار",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Front Squat",
    nameAr: "سكوات أمامي بالبار",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Smith Machine Squat",
    nameAr: "سكوات على جهاز سميث",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Hack Squat",
    nameAr: "هاك سكوات",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Leg Press",
    nameAr: "مكبس أرجل",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o6Zs4L2lUoGgk3rWw/giphy.gif",
  },
  {
    nameEn: "Leg Extension",
    nameAr: "رفرفة أمامي جهاز",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Seated Leg Curl",
    nameAr: "رفرفة خلفي جهاز (جالس)",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Lying Leg Curl",
    nameAr: "رفرفة خلفي جهاز (نائم)",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Walking Lunges",
    nameAr: "طعن (لانجز) مشي",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD5WB6zMa0jWwj6/giphy.gif",
  },
  {
    nameEn: "Dumbbell Lunges",
    nameAr: "طعن دنابل في المكان",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD5WB6zMa0jWwj6/giphy.gif",
  },
  {
    nameEn: "Bulgarian Split Squat",
    nameAr: "سكوات بلغاري (رجل واحدة)",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Romanian Deadlift (RDL)",
    nameAr: "ديدلِفت روماني (خلفيات)",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD23Z0L0fX5oRAY/giphy.gif",
  },
  {
    nameEn: "Sumo Deadlift",
    nameAr: "سومو ديدلفت",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7h4jEO9U0sOrK/giphy.gif",
  },
  {
    nameEn: "Hip Thrust",
    nameAr: "هيپ تراست (دفع حوض)",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD23Z0L0fX5oRAY/giphy.gif",
  },
  {
    nameEn: "Inner Thigh Machine (Adductor)",
    nameAr: "جهاز ضام (داخلي)",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o6Zs4L2lUoGgk3rWw/giphy.gif",
  },
  {
    nameEn: "Outer Thigh Machine (Abductor)",
    nameAr: "جهاز تفتيح (خارجي)",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o6Zs4L2lUoGgk3rWw/giphy.gif",
  },
  {
    nameEn: "Standing Calf Raise",
    nameAr: "سمانة واقف على الجهاز",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD2Bf2h5m6w4o4E/giphy.gif",
  },
  {
    nameEn: "Seated Calf Raise",
    nameAr: "سمانة جالس على الجهاز",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD2Bf2h5m6w4o4E/giphy.gif",
  },
  {
    nameEn: "Leg Press Calf Raise",
    nameAr: "سمانة على المكبس",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD2Bf2h5m6w4o4E/giphy.gif",
  },

  // --- Arms (الذراع) ---
  {
    nameEn: "Barbell Biceps Curl",
    nameAr: "تبادل باي بالبار مستقيم",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "EZ Bar Biceps Curl",
    nameAr: "تبادل باي بالبار الزجزاج",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Dumbbell Biceps Curl",
    nameAr: "تبادل باي بالدنابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Hammer Curl",
    nameAr: "باي شاكوش دنابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD6HY4OWcl7FQ5C/giphy.gif",
  },
  {
    nameEn: "Cable Biceps Curl",
    nameAr: "باي كابل سحب سفلي",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Preacher Curl EZ Bar",
    nameAr: "باي ارتكاز على حصان بالبار",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Preacher Curl Machine",
    nameAr: "باي ارتكاز على حصان على الجهاز",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Triceps Pushdown",
    nameAr: "تراي كابل سحب سفلي",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Overhead Triceps Extension Dumbbell",
    nameAr: "تراي خلفي دنابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Overhead Triceps Extension EZ Bar",
    nameAr: "تراي خلفي بالبار الزجزاج",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Overhead Triceps Extension Cable",
    nameAr: "تراي خلفي بالكابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Dips (Triceps Focus)",
    nameAr: "متوازي (تركيز تراي)",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
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
