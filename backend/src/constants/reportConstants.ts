export const REPORT_REASONS = [
  "spam",
  "scam_or_fraud",
  "harassment",
  "inappropriate_content",
  "suspicious_activity",
  "fake_listing",
  "other",
] as const;

export const REPORT_STATUSES = ["pending", "reviewed", "resolved"] as const;
export const REPORT_TARGET_TYPES = ["listing", "user"] as const;

export type ReportReason = typeof REPORT_REASONS[number];
export type ReportStatus = typeof REPORT_STATUSES[number];
export type ReportTargetType = typeof REPORT_TARGET_TYPES[number];