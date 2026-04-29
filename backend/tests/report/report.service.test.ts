import * as reportService from "../../src/services/reportService";
import { AppDataSource } from "../../src/config/data-source";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock("../../src/services/emailService", () => ({
  sendReportNotificationEmail: jest.fn().mockResolvedValue(undefined),
}));

describe("reportService", () => {
  const mockReportRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockListingRepo = {
    findOne: jest.fn(),
  };

  const mockConversationRepo = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
      if (entity?.name === "Report") return mockReportRepo;
      if (entity?.name === "User") return mockUserRepo;
      if (entity?.name === "Listing") return mockListingRepo;
      if (entity?.name === "Conversation") return mockConversationRepo;
      return null;
    });
  });

  describe("createReport", () => {
    it("creates a user report successfully", async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce({
          id: "reporter-1",
          umassEmail: "reporter@umass.edu",
        })
        .mockResolvedValueOnce({
          id: "user-456",
          umassEmail: "reported@umass.edu",
        });

      mockReportRepo.create.mockImplementation((data) => ({
        reportId: "report-1",
        ...data,
      }));
      mockReportRepo.save.mockResolvedValue(undefined);

      const result = await reportService.createReport("reporter-1", {
        targetType: "user",
        targetId: "user-456",
        reason: "spam",
        comments: "spammy behavior",
      });

      expect(result.message).toMatch(/user reported successfully/i);
      expect(result.report.targetType).toBe("user");
      expect(result.report.reportedUserId).toBe("user-456");
      expect(result.report.status).toBe("pending");
    });

    it("creates a listing report successfully", async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce({
          id: "reporter-1",
          umassEmail: "reporter@umass.edu",
        })
        .mockResolvedValueOnce({
          id: "seller-1",
          umassEmail: "seller@umass.edu",
        });

      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-123",
        sellerId: "seller-1",
      });

      mockReportRepo.create.mockImplementation((data) => ({
        reportId: "report-1",
        ...data,
      }));
      mockReportRepo.save.mockResolvedValue(undefined);

      const result = await reportService.createReport("reporter-1", {
        targetType: "listing",
        targetId: "listing-123",
        reason: "fake_listing",
      });

      expect(result.message).toMatch(/listing reported successfully/i);
      expect(result.report.reportedListingId).toBe("listing-123");
      expect(result.report.reportedUserId).toBe("seller-1");
    });

    it("rejects self user report", async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce({
          id: "reporter-1",
          umassEmail: "reporter@umass.edu",
        })
        .mockResolvedValueOnce({
          id: "reporter-1",
          umassEmail: "reporter@umass.edu",
        });

      await expect(
        reportService.createReport("reporter-1", {
          targetType: "user",
          targetId: "reporter-1",
          reason: "other",
        })
      ).rejects.toThrow("You cannot report yourself");
    });

    it("rejects own listing report", async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: "reporter-1",
        umassEmail: "reporter@umass.edu",
      });

      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-123",
        sellerId: "reporter-1",
      });

      await expect(
        reportService.createReport("reporter-1", {
          targetType: "listing",
          targetId: "listing-123",
          reason: "other",
        })
      ).rejects.toThrow("You cannot report your own listing");
    });

    it("rejects unknown reported user", async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce({
          id: "reporter-1",
          umassEmail: "reporter@umass.edu",
        })
        .mockResolvedValueOnce(null);

      await expect(
        reportService.createReport("reporter-1", {
          targetType: "user",
          targetId: "user-456",
          reason: "spam",
        })
      ).rejects.toThrow("Reported user not found");
    });

    it("rejects unknown reported listing", async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: "reporter-1",
        umassEmail: "reporter@umass.edu",
      });

      mockListingRepo.findOne.mockResolvedValue(null);

      await expect(
        reportService.createReport("reporter-1", {
          targetType: "listing",
          targetId: "listing-123",
          reason: "fake_listing",
        })
      ).rejects.toThrow("Reported listing not found");
    });
  });

  describe("getReports", () => {
    it("returns all reports", async () => {
      mockReportRepo.find.mockResolvedValue([{ reportId: "report-1" }]);

      const result = await reportService.getReports();

      expect(mockReportRepo.find).toHaveBeenCalled();
      expect(result).toEqual([{ reportId: "report-1" }]);
    });
  });

  describe("getReportById", () => {
    it("returns a report by id", async () => {
      mockReportRepo.findOne.mockResolvedValue({ reportId: "report-1" });

      const result = await reportService.getReportById("report-1");

      expect(mockReportRepo.findOne).toHaveBeenCalled();
      expect(result.reportId).toBe("report-1");
    });

    it("rejects unknown report", async () => {
      mockReportRepo.findOne.mockResolvedValue(null);

      await expect(reportService.getReportById("report-1")).rejects.toThrow(
        "Report not found"
      );
    });
  });

  describe("updateReportStatus", () => {
    it("updates report status with moderation metadata", async () => {
      mockReportRepo.findOne.mockResolvedValue({
        reportId: "report-1",
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        adminNotes: null,
      });

      mockUserRepo.findOne.mockResolvedValue({
        id: "admin-1",
        role: "admin",
      });

      mockReportRepo.save.mockResolvedValue(undefined);

      const result = await reportService.updateReportStatus("report-1", "admin-1", {
        status: "reviewed",
        adminNotes: "Checked by admin",
      });

      expect(result.status).toBe("reviewed");
      expect(result.reviewedBy).toBe("admin-1");
      expect(result.reviewedAt).toBeTruthy();
      expect(result.adminNotes).toBe("Checked by admin");
    });

    it("rejects invalid status", async () => {
      await expect(
        reportService.updateReportStatus("report-1", "admin-1", {
          status: "bad-status" as any,
        })
      ).rejects.toThrow("Valid report status is required");
    });

    it("rejects missing report", async () => {
      mockReportRepo.findOne.mockResolvedValue(null);

      await expect(
        reportService.updateReportStatus("report-1", "admin-1", {
          status: "resolved",
        })
      ).rejects.toThrow("Report not found");
    });
  });
});