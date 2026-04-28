import express from "express";
import cors from "cors";
import listingRoutes from "./routes/listingRoutes";
import authRoutes from "./routes/authRoutes";
import conversationRoutes from "./routes/conversationRoutes";
import messageRoutes from "./routes/messageRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import blockRoutes from "./routes/blockRoutes";
import reportRoutes from "./routes/reportRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import { errorHandler } from "./middleware/errorHandler";
import pickUpLocationRoutes from "./routes/pickUpLocationRoutes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("API is running");
  });

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, message: "Backend is running" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/listings", listingRoutes);
  app.use("/api/conversations", conversationRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/blocks", blockRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/pick-up-locations", pickUpLocationRoutes);
  app.use("/api/categories", categoryRoutes);

  app.use(errorHandler);

  return app;
}

export default createApp;