// tests/setup.ts
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_EXPIRES_IN = "1d";

  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  // prevents Mongoose buffering/hanging when not connected yet
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);
}, 30000); // give mongodb-memory-server time
  

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;

  const collections = await db.collections();
  for (const c of collections) {
    await c.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
}, 30000);