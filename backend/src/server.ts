import dotenv from "dotenv";
dotenv.config();

import createApp from "./app";
import { AppDataSource } from "./config/data-source";

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await AppDataSource.initialize()
    console.log("Data Source has been initialized!")

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

start();

