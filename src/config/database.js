const mongoose = require("mongoose");

/**
 * MongoDB Connection Configuration
 * Handles connection to MongoDB with proper error handling
 */
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/gym-backend";

    // استخدام المتغير اللي بيضمن إن دايماً فيه رابط متاح
    await mongoose.connect(mongoURI);

    const conn = mongoose.connection;

    // طباعة اسم الهوست بشكل صحيح
    console.log(`✓ MongoDB Connected: ${conn.host}`);

    return conn;
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
