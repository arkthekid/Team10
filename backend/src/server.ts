import dotenv from "dotenv";
dotenv.config();

import createApp from "./app";
import { connectDB } from "./config/db";
import "./models/Product";
import "./models/Category";

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await connectDB();

    const app = createApp(); // create Express instance here

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

start();