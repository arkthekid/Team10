import request from "supertest";
import express from "express";
import blockRoutes from "../../src/routes/blockRoutes";
import * as blockController from "../../src/controllers/blockController";

jest.mock("../../src/controllers/blockController");
jest.mock("../../src/middleware/auth", () => ({
  protect: (req: any, res: any, next: any) => next(),
}));

describe("blockRoutes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/blocks", blockRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/blocks/:id calls blockUser controller", async () => {
    (blockController.blockUser as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json({ message: "ok" });
    });

    const res = await request(app).post("/api/blocks/user-456");

    expect(res.status).toBe(201);
    expect(blockController.blockUser).toHaveBeenCalled();
  });

  it("GET /api/blocks calls getMyBlockedUsers controller", async () => {
    (blockController.getMyBlockedUsers as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([]);
    });

    const res = await request(app).get("/api/blocks");

    expect(res.status).toBe(200);
    expect(blockController.getMyBlockedUsers).toHaveBeenCalled();
  });

  it("DELETE /api/blocks/:id calls unblockUser controller", async () => {
    (blockController.unblockUser as jest.Mock).mockImplementation((req, res) => {
      res.status(204).send();
    });

    const res = await request(app).delete("/api/blocks/user-456");

    expect(res.status).toBe(204);
    expect(blockController.unblockUser).toHaveBeenCalled();
  });
});