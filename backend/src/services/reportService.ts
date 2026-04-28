import { AppDataSource } from "../config/data-source";
import { AppError } from "../utils/AppError";
import { Report } from "../entities/Report";
import { User } from "../entities/User";
import { Listing } from "../entities/Listing";
import { Conversation } from "../entities/Conversation";
import { sendReportNotificationEmail } from "./emailService";
import {
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "../constants/reportConstants";

type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  comments?: string | null;
  conversationId?: string;
};

type UpdateReportStatusInput = {
  status: ReportStatus;
  adminNotes?: string | null;
};

export async function createReport(reporterId: string, data: CreateReportInput) {
  const reportRepo = AppDataSource.getRepository(Report);
  const userRepo = AppDataSource.getRepository(User);
  const listingRepo = AppDataSource.getRepository(Listing);
  const conversationRepo = AppDataSource.getRepository(Conversation);

  const { targetType, targetId, reason } = data;
  const comments = data.comments?.trim() || null;
  const conversationId = data.conversationId || null;

  if (!targetType || !REPORT_TARGET_TYPES.includes(targetType)) {
    throw new AppError("Valid targetType is required", 400);
  }

  if (!targetId) {
    throw new AppError("targetId is required", 400);
  }

  if (!reason || !REPORT_REASONS.includes(reason)) {
    throw new AppError("Valid report reason is required", 400);
  }

  const reporter = await userRepo.findOne({
    where: { id: reporterId },
  });

  if (!reporter) {
    throw new AppError("Reporter not found", 404);
  }

  let reportedUserId: string | null = null;
  let reportedListingId: string | null = null;
  let reportedUser: User | null = null;

  if (targetType === "user") {
    const user = await userRepo.findOne({
      where: { id: targetId },
    });

    if (!user) {
      throw new AppError("Reported user not found", 404);
    }

    if (user.id === reporterId) {
      throw new AppError("You cannot report yourself", 400);
    }

    reportedUserId = user.id;
    reportedUser = user;

    if (conversationId) {
      const conversation = await conversationRepo.findOne({
        where: { conversationId },
      });

      if (!conversation) {
        throw new AppError("Conversation not found", 404);
      }

      if (conversation.buyerId !== reporterId && conversation.sellerId !== reporterId) {
        throw new AppError("Unauthorized", 403);
      }

      const otherParticipant =
        conversation.buyerId === reporterId
          ? conversation.sellerId
          : conversation.buyerId;

      if (otherParticipant !== user.id) {
        throw new AppError("Reported user does not match the conversation participant", 400);
      }
    }
  }

  if (targetType === "listing") {
    const listing = await listingRepo.findOne({
      where: { listingId: targetId },
    });

    if (!listing) {
      throw new AppError("Reported listing not found", 404);
    }

    if (listing.sellerId === reporterId) {
      throw new AppError("You cannot report your own listing", 400);
    }

    reportedListingId = listing.listingId;
    reportedUserId = listing.sellerId || null;

    if (reportedUserId) {
      reportedUser = await userRepo.findOne({
        where: { id: reportedUserId },
      });
    }
  }

  const report = reportRepo.create({
    reporterId,
    targetType,
    reason,
    comments,
    status: "pending",
    reportedUserId,
    reportedListingId,
    conversationId,
    reviewedBy: null,
    reviewedAt: null,
    adminNotes: null,
  });

  await reportRepo.save(report);

  try {
    await sendReportNotificationEmail({
      reportId: report.reportId,
      targetType,
      reason,
      comments,
      reporterEmail: reporter.umassEmail,
      reportedUserEmail: reportedUser?.umassEmail ?? null,
      reportedListingId,
      conversationId,
    });
  } catch (error) {
    console.error("Failed to send report notification email:", error);
  }

  return {
    message:
      targetType === "user"
        ? "User reported successfully"
        : "Listing reported successfully",
    report,
  };
}

export async function getReports() {
  const reportRepo = AppDataSource.getRepository(Report);

  return reportRepo.find({
    relations: [
      "reporter",
      "reportedUser",
      "reportedListing",
      "conversation",
      "reviewer",
    ],
    order: { createdAt: "DESC" },
  });
}

export async function getReportById(reportId: string) {
  const reportRepo = AppDataSource.getRepository(Report);

  const report = await reportRepo.findOne({
    where: { reportId },
    relations: [
      "reporter",
      "reportedUser",
      "reportedListing",
      "conversation",
      "reviewer",
    ],
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  return report;
}

export async function updateReportStatus(
  reportId: string,
  adminId: string,
  data: UpdateReportStatusInput
) {
  const reportRepo = AppDataSource.getRepository(Report);
  const userRepo = AppDataSource.getRepository(User);

  const { status } = data;
  const adminNotes = data.adminNotes?.trim() || null;

  if (!status || !REPORT_STATUSES.includes(status)) {
    throw new AppError("Valid report status is required", 400);
  }

  const report = await reportRepo.findOne({
    where: { reportId },
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  const admin = await userRepo.findOne({
    where: { id: adminId },
  });

  if (!admin) {
    throw new AppError("Admin user not found", 404);
  }

  report.status = status;
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();
  report.adminNotes = adminNotes;

  await reportRepo.save(report);

  return report;
}