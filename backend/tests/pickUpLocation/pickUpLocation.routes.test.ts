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
      (
        pickUpLocationController.getAllPickUpLocations as jest.Mock
      ).mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      const res = await request(app).get("/api/pick-up-locations");

      expect(res.status).toBe(200);
      expect(pickUpLocationController.getAllPickUpLocations).toHaveBeenCalled();
    });
  });

  describe("GET /api/pick-up-locations/:id", () => {
    it("calls getPickUpLocationById controller", async () => {
      (
        pickUpLocationController.getPickUpLocationById as jest.Mock
      ).mockImplementation((req, res) => {
        res.status(200).json({ locationId: "uuid-1", name: "Orchard Hill" });
      });

      const res = await request(app).get("/api/pick-up-locations/uuid-1");

      expect(res.status).toBe(200);
      expect(pickUpLocationController.getPickUpLocationById).toHaveBeenCalled();
    });
  });

  describe("POST /api/pick-up-locations", () => {
    it("calls createPickUpLocation controller", async () => {
      (
        pickUpLocationController.createPickUpLocation as jest.Mock
      ).mockImplementation((req, res) => {
        res.status(201).json({ locationId: "uuid-1", name: "Orchard Hill" });
      });

      const res = await request(app)
        .post("/api/pick-up-locations")
        .send({ name: "Orchard Hill" });

      expect(res.status).toBe(201);
      expect(pickUpLocationController.createPickUpLocation).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/pick-up-locations/:id", () => {
    it("calls updatePickUpLocation controller", async () => {
      (
        pickUpLocationController.updatePickUpLocation as jest.Mock
      ).mockImplementation((req, res) => {
        res.status(200).json({ locationId: "uuid-1", name: "Updated Name" });
      });

      const res = await request(app)
        .patch("/api/pick-up-locations/uuid-1")
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(pickUpLocationController.updatePickUpLocation).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/pick-up-locations/:id", () => {
    it("calls deletePickUpLocation controller", async () => {
      (
        pickUpLocationController.deletePickUpLocation as jest.Mock
      ).mockImplementation((req, res) => {
        res
          .status(200)
          .json({ message: "Pick up location deleted successfully" });
      });

      const res = await request(app).delete("/api/pick-up-locations/uuid-1");

      expect(res.status).toBe(200);
      expect(pickUpLocationController.deletePickUpLocation).toHaveBeenCalled();
    });
  });
});
