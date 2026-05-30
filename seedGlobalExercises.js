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
  {
    nameEn: "Close Grip Barbell Curl",
    nameAr: "باي بار ضيق",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Barbell Wrist Curl",
    nameAr: "رسغ باي من الأمام",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Reverse Wrist Curl",
    nameAr: "رسغ تراي من الخلف",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Concentration Curl",
    nameAr: "باي جالس مركز",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Rope Pushdown",
    nameAr: "تراي حبل كابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Reverse Rope Pushdown",
    nameAr: "تراي حبل عكسي",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },

  // --- Core (البطن والظهر السفلي) ---
  {
    nameEn: "Crunches",
    nameAr: "كرنشز (شد بطن)",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Machine Abs",
    nameAr: "جهاز بطن (شد)",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Cable Rope Crunch",
    nameAr: "بطن حبل كابل",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Ab Wheel Rollout",
    nameAr: "بطن عجلة رولاوت",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Decline Bench Sit-Ups",
    nameAr: "بطن جالس على منحدر",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Weighted Crunches",
    nameAr: "كرنشز مثقلة",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Hanging Knee Raises",
    nameAr: "رفع ركبة معلق",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Hanging Leg Raises",
    nameAr: "رفع رجل معلق",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Cable Wood Chops",
    nameAr: "تواي (تقطيع خشب بالكابل)",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Landmine Rotation",
    nameAr: "دوران لاندمين",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Pallof Press",
    nameAr: "بالوف برس",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Plank Hold",
    nameAr: "بلانك ثابت",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Side Plank",
    nameAr: "بلانك جانبي",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Russian Twists",
    nameAr: "ملتف روسي",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Bicycle Crunches",
    nameAr: "دراجة (كرنشز متبادل)",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Dead Bug",
    nameAr: "ديد باج",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Bird Dog",
    nameAr: "بيرد داج",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Suitcase Carry",
    nameAr: "حمل حقيبة (كاري)",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Farmers Carry",
    nameAr: "حمل مزارع",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Torso Rotation Machine",
    nameAr: "جهاز تدوير جسم",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },

  // === Additional Chest Exercises ===
  {
    nameEn: "Smith Machine Bench Press",
    nameAr: "بنش برس على جهاز سميث",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Lever Chest Press",
    nameAr: "دفع صدر على جهاز رافعة",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Machine Pec Fly",
    nameAr: "فراشة صدر على جهاز",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt6mM4jgmQgLJ2M/giphy.gif",
  },
  {
    nameEn: "Incline Machine Press",
    nameAr: "دفع صدر عالي على جهاز",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Decline Machine Press",
    nameAr: "دفع صدر منخفض على جهاز",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },

  // === Additional Back Exercises ===
  {
    nameEn: "Pendulum Squat",
    nameAr: "سكوات البندول",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o6Zs4PSJiq1f8nF5W/giphy.gif",
  },
  {
    nameEn: "Underhand Lat Pulldown",
    nameAr: "سحب ظهر عالي من تحت",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1M9aG94NQJm1O/giphy.gif",
  },
  {
    nameEn: "Assisted Pull-Up",
    nameAr: "عقلة مساعدة على جهاز",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD88Nsxq8S3Tj8Q/giphy.gif",
  },
  {
    nameEn: "Machine Assisted Chin-Up",
    nameAr: "عقلة ضيقة مساعدة على جهاز",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD88Nsxq8S3Tj8Q/giphy.gif",
  },
  {
    nameEn: "Lever Row",
    nameAr: "سحب على جهاز رافعة",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1Vd1AqjP4dXr2/giphy.gif",
  },

  // === Additional Shoulder Exercises ===
  {
    nameEn: "Machine Lateral Raise",
    nameAr: "رفرفة جانبي على جهاز",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },
  {
    nameEn: "Plate Loaded Shoulder Press",
    nameAr: "دفع كتف محمل بالأطباق",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD0f3Yp0J2L8nTE/giphy.gif",
  },
  {
    nameEn: "Cable Front Raise",
    nameAr: "رفرفة أمامي بالكابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5lS6Qv1rYZQwE/giphy.gif",
  },
  {
    nameEn: "High Cable Fly",
    nameAr: "تفتيح عالي بالكابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },

  // === Additional Leg Exercises ===
  {
    nameEn: "V-Squat",
    nameAr: "سكوات في (جهاز V)",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Lever Leg Press",
    nameAr: "مكبس أرجل رافعة",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o6Zs4L2lUoGgk3rWw/giphy.gif",
  },
  {
    nameEn: "Sissy Squat",
    nameAr: "سكوات سيسي",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Belt Squat",
    nameAr: "سكوات حزام",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Pendulum Squat",
    nameAr: "سكوات البندول",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Leg Extension Machine",
    nameAr: "رفرفة أمامي على جهاز",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Hamstring Curl Machine",
    nameAr: "رفرفة خلفي على جهاز",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Glute Focused Squat",
    nameAr: "سكوات مركز على الأرداف",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD23Z0L0fX5oRAY/giphy.gif",
  },
  {
    nameEn: "Single Leg Press",
    nameAr: "مكبس رجل واحدة",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o6Zs4L2lUoGgk3rWw/giphy.gif",
  },
  {
    nameEn: "Bulgarian Dumbbell Lunge",
    nameAr: "طعن دنابل بلغاري",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD5WB6zMa0jWwj6/giphy.gif",
  },

  // === Additional Arm Exercises ===
  {
    nameEn: "Spider Curl",
    nameAr: "باي عنكبوت ارتكاز",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Machine Biceps Curl",
    nameAr: "باي على جهاز",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Triceps Dips",
    nameAr: "متوازي تراي",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Bench Dips",
    nameAr: "تراي بنش",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Machine Triceps Press",
    nameAr: "تراي على جهاز دفع",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "V-Bar Pushdown",
    nameAr: "تراي V-بار كابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Kickbacks Dumbbell",
    nameAr: "تراي ركل دنابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Cable Kickbacks",
    nameAr: "تراي ركل كابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Incline Dumbbell Curl",
    nameAr: "باي دنابل مائل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Machine Curl",
    nameAr: "باي على جهاز",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },

  // === Additional Core Exercises ===
  {
    nameEn: "Ab Crunch Machine",
    nameAr: "جهاز شد بطن",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Decline Crunches",
    nameAr: "كرنشز على منحدر",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Ab Coaster",
    nameAr: "كوستر بطن",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Weighted Plate Crunches",
    nameAr: "كرنشز مع طارة",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Medicine Ball Crunches",
    nameAr: "كرنشز مع كرة طب",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },

  // === Chest Variation Additions ===
  {
    nameEn: "Close Grip Bench Press",
    nameAr: "بنش برس قبضة ضيقة",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Smith Machine Incline Press",
    nameAr: "بنش مائل على جهاز سميث",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Decline Push-Up",
    nameAr: "تمرين ضغط مائل للأسفل",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt3zqug9F8x7K4E/giphy.gif",
  },
  {
    nameEn: "Clap Push-Up",
    nameAr: "ضغط تصفيقة",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt3zqug9F8x7K4E/giphy.gif",
  },
  {
    nameEn: "Svend Press",
    nameAr: "ضغط سفند",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt6mM4jgmQgLJ2M/giphy.gif",
  },
  {
    nameEn: "Floor Press",
    nameAr: "بنش أرضي",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Ring Push-Up",
    nameAr: "ضغط على حلقات",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt3zqug9F8x7K4E/giphy.gif",
  },
  {
    nameEn: "Cable Incline Fly",
    nameAr: "فلاي مائل بالكابل",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt6mM4jgmQgLJ2M/giphy.gif",
  },
  {
    nameEn: "Decline Cable Fly",
    nameAr: "فلاي مائل بالكابل للأسفل",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o6Zt6mM4jgmQgLJ2M/giphy.gif",
  },
  {
    nameEn: "Machine Chest Dip",
    nameAr: "دفع صدر على جهاز متوازي",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },
  {
    nameEn: "Chest Press Machine",
    nameAr: "دفع صدر على الجهاز",
    targetMuscle: "Chest",
    gifUrl: "https://media.giphy.com/media/3o7aD6dyb4jO4z2M3K/giphy.gif",
  },

  // === Back Variation Additions ===
  {
    nameEn: "Chest Supported Dumbbell Row",
    nameAr: "سحب دنابل مدعوم على الصدر",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1Vd1AqjP4dXr2/giphy.gif",
  },
  {
    nameEn: "Inverted Row",
    nameAr: "سحب مقلوب",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1Vd1AqjP4dXr2/giphy.gif",
  },
  {
    nameEn: "Renegade Row",
    nameAr: "سحب رينيجيد",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o6Zs4PSJiq1f8nF5W/giphy.gif",
  },
  {
    nameEn: "Meadows Row",
    nameAr: "سحب مودز",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o6Zs4PSJiq1f8nF5W/giphy.gif",
  },
  {
    nameEn: "Single Arm Cable Row",
    nameAr: "سحب كابل بذراع واحدة",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1Vd1AqjP4dXr2/giphy.gif",
  },
  {
    nameEn: "Kroc Row",
    nameAr: "سحب كروك",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o6Zs4PSJiq1f8nF5W/giphy.gif",
  },
  {
    nameEn: "Underhand Barbell Row",
    nameAr: "سحب بار بالقبضة المقلوبة",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1M9aG94NQJm1O/giphy.gif",
  },
  {
    nameEn: "Seal Row",
    nameAr: "سحب سيل",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1Vd1AqjP4dXr2/giphy.gif",
  },
  {
    nameEn: "Renegade Row",
    nameAr: "سحب رينيجيد",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o6Zs4PSJiq1f8nF5W/giphy.gif",
  },
  {
    nameEn: "Band Pull-Apart",
    nameAr: "سحب حزام مفتوح",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o6Zs4PSJiq1f8nF5W/giphy.gif",
  },
  {
    nameEn: "Chest Supported Row",
    nameAr: "سحب مدعوم على الصدر",
    targetMuscle: "Back",
    gifUrl: "https://media.giphy.com/media/3o7aD1Vd1AqjP4dXr2/giphy.gif",
  },

  // === Shoulders Variation Additions ===
  {
    nameEn: "Landmine Press",
    nameAr: "ضغط لاندمين",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD0f3Yp0J2L8nTE/giphy.gif",
  },
  {
    nameEn: "Z-Press",
    nameAr: "ضغط Z",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD0f3Yp0J2L8nTE/giphy.gif",
  },
  {
    nameEn: "Cuban Press",
    nameAr: "ضغط كوبان",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },
  {
    nameEn: "Incline Rear Delt Fly",
    nameAr: "رفرفة خلفي مائلة",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD3r6zNw0m7w0Re/giphy.gif",
  },
  {
    nameEn: "Prone Y Raise",
    nameAr: "رفع Y مستلقي",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD3r6zNw0m7w0Re/giphy.gif",
  },
  {
    nameEn: "Cable External Rotation",
    nameAr: "دوران خارجي بالكابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },
  {
    nameEn: "Dumbbell Scaption",
    nameAr: "رفرفة سكابشن بالدنابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD5fPFxj6Y2P5iM/giphy.gif",
  },
  {
    nameEn: "Cable Face Pull",
    nameAr: "سحب وجه بالكابل",
    targetMuscle: "Shoulders",
    gifUrl: "https://media.giphy.com/media/3o7aD2fXjAghTGgk9K/giphy.gif",
  },

  // === Legs Variation Additions ===
  {
    nameEn: "Goblet Squat",
    nameAr: "سكوات كوب",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Cossack Squat",
    nameAr: "سكوات كوساك",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Reverse Lunge",
    nameAr: "لونج عكسي",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD5WB6zMa0jWwj6/giphy.gif",
  },
  {
    nameEn: "Step-Up",
    nameAr: "تمرين خطوة",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Single-Leg Romanian Deadlift",
    nameAr: "ديدليفت روماني رجل واحدة",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Nordic Ham Curl",
    nameAr: "كور هامسترينج نورديك",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Glute Ham Raise",
    nameAr: "رفع هامسترينج الأرداف",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD5WB6zMa0jWwj6/giphy.gif",
  },
  {
    nameEn: "Smith Machine Split Squat",
    nameAr: "سكوات منفصل على جهاز سميث",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Weighted Hip Thrust",
    nameAr: "هيبت تراست مثقل",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD23Z0L0fX5oRAY/giphy.gif",
  },
  {
    nameEn: "Glute Bridge",
    nameAr: "جسر أرداف",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD23Z0L0fX5oRAY/giphy.gif",
  },
  {
    nameEn: "Cable Pull-Through",
    nameAr: "سحب كابل من الخلف",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Sled Push",
    nameAr: "دفع الزلاجة",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },
  {
    nameEn: "Box Squat",
    nameAr: "سكوات على صندوق",
    targetMuscle: "Legs",
    gifUrl: "https://media.giphy.com/media/3o7aD7rYf7HpieAwS4/giphy.gif",
  },

  // === Arms Variation Additions ===
  {
    nameEn: "Zottman Curl",
    nameAr: "باي زوتمن",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Cable Rope Hammer Curl",
    nameAr: "باي مطرقة بالكابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD6HY4OWcl7FQ5C/giphy.gif",
  },
  {
    nameEn: "Cable Reverse Curl",
    nameAr: "باي عكسي بالكابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Dumbbell Skullcrusher",
    nameAr: "جمجمة دنابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "One-Arm Overhead Cable Extension",
    nameAr: "تراي خلفي كابل بذراع واحدة",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "JM Press",
    nameAr: "ضغط JM",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Diamond Push-Up",
    nameAr: "ضغط ماسي",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "TRX Biceps Curl",
    nameAr: "باي TRX",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "TRX Triceps Press",
    nameAr: "تراي TRX",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Cable Overhead Triceps Extension",
    nameAr: "تراي خلفي بالكابل",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },
  {
    nameEn: "Barbell High Curl",
    nameAr: "باي بار عالي",
    targetMuscle: "Arms",
    gifUrl: "https://media.giphy.com/media/3o7aD2r8N3KHd9YjJM/giphy.gif",
  },

  // === Core Variation Additions ===
  {
    nameEn: "Side Plank Dips",
    nameAr: "بلانك جانبي مع خفض",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Hanging Windshield Wipers",
    nameAr: "مسحات المراوح المعلقة",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Stability Ball Pike",
    nameAr: "بايك على كرة التوازن",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "TRX Fallout",
    nameAr: "سقوط TRX",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Mountain Climbers",
    nameAr: "متسلقو الجبال",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Plank Shoulder Taps",
    nameAr: "بلانك مع ضربة كتف",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Captain's Chair Leg Raise",
    nameAr: "رفع ساق على كرسي الكابتن",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Reverse Crunch",
    nameAr: "كرنشز عكسي",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Weighted Plank",
    nameAr: "بلانك مثقل",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Stability Ball Rollout",
    nameAr: "رول اوت على الكرة",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Dragon Flag",
    nameAr: "علم التنين",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Scissor Kicks",
    nameAr: "مقصيات الساقين",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Kettlebell Windmill",
    nameAr: "طاحونة كرة ثقيلة",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Windshield Wipers",
    nameAr: "مسحات الزجاج الأمامي",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
  },
  {
    nameEn: "Russian Twist with Medicine Ball",
    nameAr: "التواء روسي مع كرة طبية",
    targetMuscle: "Core",
    gifUrl: "https://media.giphy.com/media/3o7aD0J1wqKQ9JZlJe/giphy.gif",
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
