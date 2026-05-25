require("dotenv").config({ path: "./.env" }); // تعديل مسار الـ env عشان يرفع على اللايف

const connectDB = require("./src/config/database");
const GlobalFood = require("./src/models/GlobalFood");

const foods = [
  // === البروتينات (اللحوم والطيور) ===
  { nameEn: "Chicken Breast (Cooked)", nameAr: "صدور دجاج (مطهية)", calories: 165, protein: 31, carbs: 0, fats: 3.6, baseUnit: "100g" },
  { nameEn: "Chicken Thigh", nameAr: "وراك دجاج (مطهية)", calories: 209, protein: 26, carbs: 0, fats: 10.9, baseUnit: "100g" },
  { nameEn: "Turkey Breast", nameAr: "صدر ديك رومي", calories: 135, protein: 30, carbs: 0, fats: 1, baseUnit: "100g" },
  { nameEn: "Lean Beef (Cooked)", nameAr: "لحم بقري أحمر (خالي من الدهن)", calories: 250, protein: 26, carbs: 0, fats: 15, baseUnit: "100g" },
  { nameEn: "Minced Beef (Lean)", nameAr: "لحم مفروم (قليل الدسم)", calories: 212, protein: 25, carbs: 0, fats: 12, baseUnit: "100g" },
  { nameEn: "Beef Liver", nameAr: "كبدة بقري", calories: 165, protein: 26, carbs: 3.8, fats: 4.4, baseUnit: "100g" },

  // === البروتينات (الأسماك) ===
  { nameEn: "Tilapia Fish", nameAr: "سمك بلطي", calories: 96, protein: 20, carbs: 0, fats: 1.7, baseUnit: "100g" },
  { nameEn: "Salmon", nameAr: "سمك سلمون", calories: 208, protein: 22, carbs: 0, fats: 12, baseUnit: "100g" },
  { nameEn: "Tuna (in water)", nameAr: "تونة (مصفاة من الماء)", calories: 96, protein: 21, carbs: 0, fats: 1, baseUnit: "100g" },
  { nameEn: "Tuna (in oil)", nameAr: "تونة (بالزيت)", calories: 186, protein: 19, carbs: 0, fats: 11, baseUnit: "100g" },
  { nameEn: "Shrimp (Cooked)", nameAr: "جمبري (مطهي)", calories: 99, protein: 24, carbs: 0.2, fats: 0.3, baseUnit: "100g" },
  { nameEn: "Mackerel", nameAr: "سمك ماكريل", calories: 205, protein: 19, carbs: 0, fats: 14, baseUnit: "100g" },

  // === البروتينات (البيض ومنتجات الألبان) ===
  { nameEn: "Whole Egg", nameAr: "بيضة كاملة (مسلوقة)", calories: 70, protein: 6.3, carbs: 0.6, fats: 4.8, baseUnit: "1 egg" },
  { nameEn: "Egg White", nameAr: "بياض بيض", calories: 17, protein: 3.6, carbs: 0.2, fats: 0.1, baseUnit: "1 egg white" },
  { nameEn: "Cottage Cheese", nameAr: "جبنة قريش", calories: 98, protein: 11, carbs: 3.8, fats: 4.7, baseUnit: "100g" },
  { nameEn: "Greek Yogurt", nameAr: "زبادي يوناني (سادة)", calories: 59, protein: 10, carbs: 3.6, fats: 0.4, baseUnit: "100g" },
  { nameEn: "Normal Yogurt", nameAr: "زبادي بلدي", calories: 61, protein: 3.5, carbs: 4.7, fats: 3.3, baseUnit: "100g" },
  { nameEn: "Skimmed Milk", nameAr: "حليب خالي الدسم", calories: 34, protein: 3.4, carbs: 5, fats: 0.1, baseUnit: "100ml" },
  { nameEn: "Full Fat Milk", nameAr: "حليب كامل الدسم", calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, baseUnit: "100ml" },

  // === النشويات (الكربوهيدرات) ===
  { nameEn: "Rolled Oats", nameAr: "شوفان (خام)", calories: 389, protein: 16.9, carbs: 66, fats: 6.9, baseUnit: "100g" },
  { nameEn: "White Rice (Cooked)", nameAr: "أرز أبيض (مطبوخ)", calories: 130, protein: 2.7, carbs: 28, fats: 0.3, baseUnit: "100g" },
  { nameEn: "Basmati Rice (Cooked)", nameAr: "أرز بسمتي (مطبوخ)", calories: 121, protein: 3.5, carbs: 25, fats: 0.4, baseUnit: "100g" },
  { nameEn: "Brown Rice (Cooked)", nameAr: "أرز بني (مطبوخ)", calories: 111, protein: 2.6, carbs: 23, fats: 0.9, baseUnit: "100g" },
  { nameEn: "Pasta (Cooked)", nameAr: "مكرونة (مطبوخة)", calories: 158, protein: 5.8, carbs: 31, fats: 1, baseUnit: "100g" },
  { nameEn: "Sweet Potato (Cooked)", nameAr: "بطاطا حلوة (مشوية/مسلوقة)", calories: 86, protein: 1.6, carbs: 20, fats: 0.1, baseUnit: "100g" },
  { nameEn: "Potato (Boiled)", nameAr: "بطاطس (مسلوقة)", calories: 77, protein: 2, carbs: 17, fats: 0.1, baseUnit: "100g" },
  { nameEn: "Baladi Bread", nameAr: "عيش بلدي (مصري)", calories: 275, protein: 9, carbs: 55, fats: 1, baseUnit: "100g" },
  { nameEn: "Whole Wheat Bread", nameAr: "عيش سن (قمح كامل)", calories: 247, protein: 13, carbs: 43, fats: 3.5, baseUnit: "100g" },
  { nameEn: "Rice Cakes", nameAr: "رايس كيك (قطعة)", calories: 35, protein: 0.7, carbs: 7.3, fats: 0.3, baseUnit: "1 piece" },

  // === البقوليات ===
  { nameEn: "Fava Beans (Cooked)", nameAr: "فول مدمس", calories: 110, protein: 8, carbs: 20, fats: 1, baseUnit: "100g" },
  { nameEn: "Lentils (Cooked)", nameAr: "عدس أصفر (مطبوخ)", calories: 116, protein: 9, carbs: 20, fats: 0.4, baseUnit: "100g" },
  { nameEn: "Chickpeas (Cooked)", nameAr: "حمص الشام (مطبوخ)", calories: 164, protein: 9, carbs: 27, fats: 2.6, baseUnit: "100g" },

  // === الدهون الصحية ===
  { nameEn: "Olive Oil", nameAr: "زيت زيتون", calories: 119, protein: 0, carbs: 0, fats: 13.5, baseUnit: "1 tbsp (15ml)" },
  { nameEn: "Peanut Butter", nameAr: "زبدة فول سوداني", calories: 94, protein: 4, carbs: 3, fats: 8, baseUnit: "1 tbsp (16g)" },
  { nameEn: "Almonds", nameAr: "لوز (خام)", calories: 579, protein: 21, carbs: 22, fats: 50, baseUnit: "100g" },
  { nameEn: "Peanuts", nameAr: "فول سوداني (محمص)", calories: 567, protein: 26, carbs: 16, fats: 49, baseUnit: "100g" },
  { nameEn: "Walnuts", nameAr: "عين جمل", calories: 654, protein: 15, carbs: 14, fats: 65, baseUnit: "100g" },
  { nameEn: "Avocado", nameAr: "أفوكادو", calories: 160, protein: 2, carbs: 9, fats: 15, baseUnit: "100g" },
  { nameEn: "Chia Seeds", nameAr: "بذور الشيا", calories: 486, protein: 17, carbs: 42, fats: 31, baseUnit: "100g" },
  { nameEn: "Flaxseeds", nameAr: "بذور الكتان", calories: 534, protein: 18, carbs: 29, fats: 42, baseUnit: "100g" },

  // === الفواكه ===
  { nameEn: "Banana", nameAr: "موز", calories: 89, protein: 1.1, carbs: 23, fats: 0.3, baseUnit: "100g" },
  { nameEn: "Dates", nameAr: "تمر", calories: 277, protein: 1.8, carbs: 75, fats: 0.2, baseUnit: "100g" },
  { nameEn: "Apple", nameAr: "تفاح", calories: 52, protein: 0.3, carbs: 14, fats: 0.2, baseUnit: "100g" },
  { nameEn: "Orange", nameAr: "برتقال", calories: 47, protein: 0.9, carbs: 12, fats: 0.1, baseUnit: "100g" },
  { nameEn: "Watermelon", nameAr: "بطيخ", calories: 30, protein: 0.6, carbs: 8, fats: 0.2, baseUnit: "100g" },
  { nameEn: "Strawberries", nameAr: "فراولة", calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3, baseUnit: "100g" },

  // === الخضروات ===
  { nameEn: "Broccoli", nameAr: "بروكلي", calories: 34, protein: 2.8, carbs: 6, fats: 0.4, baseUnit: "100g" },
  { nameEn: "Spinach", nameAr: "سبانخ", calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, baseUnit: "100g" },
  { nameEn: "Cucumber", nameAr: "خيار", calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1, baseUnit: "100g" },
  { nameEn: "Tomato", nameAr: "طماطم", calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, baseUnit: "100g" },
  { nameEn: "Lettuce", nameAr: "خس", calories: 15, protein: 1.4, carbs: 2.9, fats: 0.2, baseUnit: "100g" },
  { nameEn: "Mixed Salad", nameAr: "سلطة خضراء (بدون زيت)", calories: 20, protein: 1, carbs: 4, fats: 0.2, baseUnit: "100g" },

  // === المكملات الغذائية ===
  { nameEn: "Whey Protein Isolate", nameAr: "واي بروتين ايزوليت", calories: 110, protein: 25, carbs: 1, fats: 0, baseUnit: "1 scoop (30g)" },
  { nameEn: "Whey Protein Concentrate", nameAr: "واي بروتين كونسينتريت", calories: 120, protein: 24, carbs: 3, fats: 2, baseUnit: "1 scoop (30g)" },
  { nameEn: "Casein Protein", nameAr: "بروتين كازين (بطيء الامتصاص)", calories: 110, protein: 24, carbs: 3, fats: 1, baseUnit: "1 scoop (30g)" },
  { nameEn: "Mass Gainer", nameAr: "ماس جينر", calories: 350, protein: 15, carbs: 70, fats: 3, baseUnit: "1 scoop" },
  { nameEn: "Creatine", nameAr: "كرياتين", calories: 0, protein: 0, carbs: 0, fats: 0, baseUnit: "1 scoop (5g)" },
];

const run = async () => {
  try {
    await connectDB();
    await GlobalFood.deleteMany({});
    await GlobalFood.insertMany(foods);
    console.log(`✓ Seeded ${foods.length} GlobalFood records successfully to Atlas Database.`);
    process.exit(0);
  } catch (error) {
    console.error("✗ Failed to seed GlobalFood", error);
    process.exit(1);
  }
};

run();