import { apiFetch } from "./api";

export type ReportReason =
  | "spam"
  | "scam_or_fraud"
  | "harassment"
  | "inappropriate_content"
  | "suspicious_activity"
  | "fake_listing"
  | "other";

export async function createReport(reportData: {
  targetType: "listing" | "user";
  targetId: string;
  reason: ReportReason;
  comments?: string | null;
  conversationId?: string;
}) {
  return apiFetch("/reports", {
    method: "POST",
    body: JSON.stringify(reportData),
  });
}