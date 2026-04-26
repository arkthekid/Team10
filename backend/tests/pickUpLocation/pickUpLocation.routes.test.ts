import request from "supertest";
import express from "express";
import pickUpLocationRoutes from "../../src/routes/pickUpLocationRoutes";
import * as pickUpLocationController from "../../src/controllers/pickUpLocationController";

jest.mock("../../src/controllers/pickUpLocationController");
jest.mock("../../src/middleware/auth", () => ({
  protect: (req: any, res: any, next: any) => next(),
}));
jest.mock("../../src/middleware/adminMiddleware", () => ({
  requireAdmin: (req: any, res: any, next: any) => next(),
}));

describe("pickUpLocationRoutes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/pick-up-locations", pickUpLocationRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/pick-up-locations", () => {
    it("calls getAllPickUpLocations controller", async () => {
      (pickUpLocationController.getAllPickUpLocations as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(200).json([]);
        }
      );

      const res = await request(app).get("/api/pick-up-locations");

      expect(res.status).toBe(200);
      expect(pickUpLocationController.getAllPickUpLocations).toHaveBeenCalled();
    });
  });
});