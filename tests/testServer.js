const path = require("path");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;
let server;
let initialized = false;

const setupTestServer = async () => {
  if (initialized) {
    return { app, server, mongoose };
  }

  process.env.NODE_ENV = process.env.NODE_ENV || "test";
  process.env.PORT = process.env.PORT || "0";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  const loaded = require(path.join(__dirname, "../server"));
  app = loaded.app;
  server = loaded.server;

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once("open", resolve));
  }

  initialized = true;
  return { app, server, mongoose };
};

const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

const closeTestServer = async () => {
  if (server && server.listening) {
    await new Promise((resolve) => server.close(resolve));
  }

  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }

  initialized = false;
  app = undefined;
  server = undefined;
  mongoServer = undefined;
};

module.exports = {
  setupTestServer,
  clearDatabase,
  closeTestServer,
};
