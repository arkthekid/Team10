import { Request, Response } from "express";
import * as reportService from "../../src/services/reportService";
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
} from "../../src/controllers/reportController";

jest.mock("../../src/services/reportService");
jest.mock("../../src/utils/getUserId", () => ({
  getUserId: jest.fn(() => "admin-or-user-123"),
}));

const flushPromises = () => new Promise(process.nextTick);

describe("reportController", () => {
  let mockReq: Partial<Request<{ id: string }>>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      params: { id: "" },
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("createReport", () => {
    it("returns 201 and json response when createReport succeeds", async () => {
      const serviceResult = {
        message: "User reported successfully",
        report: {
          reportId: "report-1",
          targetType: "user",
          reportedUserId: "user-456",
        },
      };

      mockReq.body = {
        targetType: "user",
        targetId: "user-456",
        reason: "spam",
      };

      (reportService.createReport as jest.Mock).mockResolvedValue(serviceResult);

      createReport(mockReq as Request, mockRes as Response, mockNext);
      await flushPromises();

      expect(reportService.createReport).toHaveBeenCalledWith(
        "admin-or-user-123",
        mockReq.body
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResult);
    });

    it("calls next(error) when createReport fails", async () => {
      const error = new Error("Create report failed");
      (reportService.createReport as jest.Mock).mockRejectedValue(error);

      createReport(mockReq as Request, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getReports", () => {
    it("returns 200 and json response when getReports succeeds", async () => {
      const serviceResult = [{ reportId: "report-1" }];

      (reportService.getReports as jest.Mock).mockResolvedValue(serviceResult);

      getReports(mockReq as Request, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResult);
    });

    it("calls next(error) when getReports fails", async () => {
      const error = new Error("Get reports failed");
      (reportService.getReports as jest.Mock).mockRejectedValue(error);

      getReports(mockReq as Request, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getReportById", () => {
    it("returns 200 and json response when getReportById succeeds", async () => {
      const serviceResult = { reportId: "report-1" };
      mockReq.params = { id: "report-1" };

      (reportService.getReportById as jest.Mock).mockResolvedValue(serviceResult);

      getReportById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(reportService.getReportById).toHaveBeenCalledWith("report-1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResult);
    });

    it("calls next(error) when getReportById fails", async () => {
      const error = new Error("Get report failed");
      mockReq.params = { id: "report-1" };

      (reportService.getReportById as jest.Mock).mockRejectedValue(error);

      getReportById(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateReportStatus", () => {
    it("returns 200 and json response when updateReportStatus succeeds", async () => {
      const serviceResult = {
        reportId: "report-1",
        status: "reviewed",
      };

      mockReq.params = { id: "report-1" };
      mockReq.body = { status: "reviewed", adminNotes: "Looks valid" };

      (reportService.updateReportStatus as jest.Mock).mockResolvedValue(serviceResult);

      updateReportStatus(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(reportService.updateReportStatus).toHaveBeenCalledWith(
        "report-1",
        "admin-or-user-123",
        mockReq.body
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResult);
    });

    it("calls next(error) when updateReportStatus fails", async () => {
      const error = new Error("Update report failed");
      mockReq.params = { id: "report-1" };
      mockReq.body = { status: "resolved" };

      (reportService.updateReportStatus as jest.Mock).mockRejectedValue(error);

      updateReportStatus(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});