const mongoose = require("mongoose");
const config = require("./config");

/**
 * MongoDB Connection Configuration
 * Handles connection to MongoDB with proper error handling
 */
const connectDB = async () => {
  try {
    const mongoURI = config.mongodbUri;

    await mongoose.connect(mongoURI);

    const conn = mongoose.connection;

    if (config.nodeEnv !== "production") {
      console.log(`✓ MongoDB Connected: ${conn.host}`);
    }

    return conn;
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
