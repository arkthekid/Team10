import request from "supertest";
import express from "express";
import favoriteRoutes from "../../src/routes/favoriteRoutes";
import * as favoriteController from "../../src/controllers/favoriteController";

jest.mock("../../src/controllers/favoriteController");
jest.mock("../../src/middleware/auth", () => ({
  protect: (req: any, res: any, next: any) => next(),
}));

describe("favoriteRoutes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/favorites", favoriteRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/favorites/:listingId calls addFavorite controller", async () => {
    (favoriteController.addFavorite as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json({ message: "ok" });
    });

    const res = await request(app).post("/api/favorites/listing-123");

    expect(res.status).toBe(201);
    expect(favoriteController.addFavorite).toHaveBeenCalled();
  });

  it("GET /api/favorites calls getMyFavorites controller", async () => {
    (favoriteController.getMyFavorites as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([]);
    });

    const res = await request(app).get("/api/favorites");

    expect(res.status).toBe(200);
    expect(favoriteController.getMyFavorites).toHaveBeenCalled();
  });

  it("DELETE /api/favorites/:listingId calls removeFavorite controller", async () => {
    (favoriteController.removeFavorite as jest.Mock).mockImplementation((req, res) => {
      res.status(204).send();
    });

    const res = await request(app).delete("/api/favorites/listing-123");

    expect(res.status).toBe(204);
    expect(favoriteController.removeFavorite).toHaveBeenCalled();
  });
});