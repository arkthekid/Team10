import request from "supertest";
import express from "express";
import reportRoutes from "../../src/routes/reportRoutes";
import * as reportController from "../../src/controllers/reportController";

jest.mock("../../src/controllers/reportController");
jest.mock("../../src/middleware/auth", () => ({
  protect: (req: any, res: any, next: any) => next(),
}));
jest.mock("../../src/middleware/adminMiddleware", () => ({
  requireAdmin: (req: any, res: any, next: any) => next(),
}));

describe("reportRoutes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reports", reportRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/reports calls createReport controller", async () => {
    (reportController.createReport as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json({ message: "ok" });
    });

    const res = await request(app).post("/api/reports").send({
      targetType: "user",
      targetId: "user-456",
      reason: "spam",
    });

    expect(res.status).toBe(201);
    expect(reportController.createReport).toHaveBeenCalled();
  });

  it("GET /api/reports calls getReports controller", async () => {
    (reportController.getReports as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([]);
    });

    const res = await request(app).get("/api/reports");

    expect(res.status).toBe(200);
    expect(reportController.getReports).toHaveBeenCalled();
  });

  it("GET /api/reports/:id calls getReportById controller", async () => {
    (reportController.getReportById as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ reportId: "report-1" });
    });

    const res = await request(app).get("/api/reports/report-1");

    expect(res.status).toBe(200);
    expect(reportController.getReportById).toHaveBeenCalled();
  });

  it("PATCH /api/reports/:id/status calls updateReportStatus controller", async () => {
    (reportController.updateReportStatus as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ reportId: "report-1", status: "reviewed" });
    });

    const res = await request(app)
      .patch("/api/reports/report-1/status")
      .send({ status: "reviewed" });

    expect(res.status).toBe(200);
    expect(reportController.updateReportStatus).toHaveBeenCalled();
  });
});