import request from "supertest";

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-verification-token"),
}));

jest.mock("../../src/services/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendReportNotificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";

const app = createApp();

const uniqueEmail = () =>
  `report-api+${Date.now()}-${Math.floor(Math.random() * 10000)}@umass.edu`;

async function registerVerifyAndLogin(
  email = uniqueEmail(),
  name = "Report User",
  role: "user" | "admin" = "user"
) {
  const registerRes = await request(app).post("/api/auth/register").send({
    name,
    umassEmail: email,
    password: "Test1234!",
  });

  expect(registerRes.status).toBe(201);

  await AppDataSource.query(
    `UPDATE "user" SET "isVerified" = true, "role" = $1 WHERE "umassEmail" = $2`,
    [role, email]
  );

  const loginRes = await request(app).post("/api/auth/login").send({
    umassEmail: email,
    password: "Test1234!",
  });

  expect(loginRes.status).toBe(200);

  return {
    email,
    token: loginRes.body.token,
    user: loginRes.body.user,
  };
}

async function createListingForUser(token: string, overrides: Partial<any> = {}) {
  const res = await request(app)
    .post("/api/listings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Reported Listing",
      pickUpLocation: "Campus Center",
      description: "Listing for report tests",
      price: 50,
      condition: "Used",
      status: "available",
      category: "clothing",
      imageUrl: null,
      ...overrides,
    });

  expect(res.status).toBe(201);
  return res.body;
}

async function startConversation(token: string, listingId: string) {
  const res = await request(app)
    .post(`/api/listings/${listingId}/conversations`)
    .set("Authorization", `Bearer ${token}`);

  return res;
}

describe("Report API", () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  beforeEach(async () => {
    await AppDataSource.query(`DELETE FROM "message"`);
    await AppDataSource.query(`DELETE FROM "conversation"`);
    await AppDataSource.query(`DELETE FROM "report"`);
    await AppDataSource.query(`DELETE FROM "favorite"`);
    await AppDataSource.query(`DELETE FROM "block"`);
    await AppDataSource.query(`DELETE FROM "listing_image"`);
    await AppDataSource.query(`DELETE FROM "listing"`);
    await AppDataSource.query(`DELETE FROM "user"`);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it("POST /api/reports reports a user successfully", async () => {
    const reporter = await registerVerifyAndLogin(uniqueEmail(), "Reporter");
    const reported = await registerVerifyAndLogin(uniqueEmail(), "Reported");

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporter.token}`)
      .send({
        targetType: "user",
        targetId: reported.user.id,
        reason: "suspicious_activity",
        comments: "This user is acting strangely",
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/user reported successfully/i);
    expect(res.body.report).toBeTruthy();
    expect(res.body.report.targetType).toBe("user");
    expect(res.body.report.reportedUserId).toBe(reported.user.id);
    expect(res.body.report.status).toBe("pending");
  });

  it("POST /api/reports reports a listing successfully", async () => {
    const seller = await registerVerifyAndLogin(uniqueEmail(), "Seller");
    const reporter = await registerVerifyAndLogin(uniqueEmail(), "Reporter");
    const listing = await createListingForUser(seller.token);

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporter.token}`)
      .send({
        targetType: "listing",
        targetId: listing.listingId,
        reason: "fake_listing",
        comments: "This listing looks fake",
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/listing reported successfully/i);
    expect(res.body.report.targetType).toBe("listing");
    expect(res.body.report.reportedListingId).toBe(listing.listingId);
    expect(res.body.report.reportedUserId).toBe(seller.user.id);
  });

  it("POST /api/reports rejects reporting yourself", async () => {
    const user = await registerVerifyAndLogin(uniqueEmail(), "Self");

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        targetType: "user",
        targetId: user.user.id,
        reason: "other",
        comments: "Self report",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot report yourself/i);
  });

  it("POST /api/reports rejects reporting your own listing", async () => {
    const seller = await registerVerifyAndLogin(uniqueEmail(), "Seller");
    const listing = await createListingForUser(seller.token);

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${seller.token}`)
      .send({
        targetType: "listing",
        targetId: listing.listingId,
        reason: "other",
        comments: "Own listing",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/own listing/i);
  });

  it("POST /api/reports rejects missing token", async () => {
    const reported = await registerVerifyAndLogin(uniqueEmail(), "Reported");

    const res = await request(app).post("/api/reports").send({
      targetType: "user",
      targetId: reported.user.id,
      reason: "spam",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token/i);
  });

  it("GET /api/reports allows admin", async () => {
    const admin = await registerVerifyAndLogin(uniqueEmail(), "Admin", "admin");
    const reporter = await registerVerifyAndLogin(uniqueEmail(), "Reporter");
    const reported = await registerVerifyAndLogin(uniqueEmail(), "Reported");

    await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporter.token}`)
      .send({
        targetType: "user",
        targetId: reported.user.id,
        reason: "spam",
      });

    const res = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it("GET /api/reports rejects regular user", async () => {
    const user = await registerVerifyAndLogin(uniqueEmail(), "Regular User");

    const res = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  it("GET /api/reports/:id returns report details for admin", async () => {
    const admin = await registerVerifyAndLogin(uniqueEmail(), "Admin", "admin");
    const reporter = await registerVerifyAndLogin(uniqueEmail(), "Reporter");
    const reported = await registerVerifyAndLogin(uniqueEmail(), "Reported");

    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporter.token}`)
      .send({
        targetType: "user",
        targetId: reported.user.id,
        reason: "harassment",
      });

    const reportId = createRes.body.report.reportId;

    const res = await request(app)
      .get(`/api/reports/${reportId}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.reportId).toBe(reportId);
    expect(res.body.reason).toBe("harassment");
  });

  it("PATCH /api/reports/:id/status updates report for admin", async () => {
    const admin = await registerVerifyAndLogin(uniqueEmail(), "Admin", "admin");
    const reporter = await registerVerifyAndLogin(uniqueEmail(), "Reporter");
    const reported = await registerVerifyAndLogin(uniqueEmail(), "Reported");

    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporter.token}`)
      .send({
        targetType: "user",
        targetId: reported.user.id,
        reason: "spam",
      });

    const reportId = createRes.body.report.reportId;

    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        status: "reviewed",
        adminNotes: "Checked and flagged",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("reviewed");
    expect(res.body.adminNotes).toBe("Checked and flagged");
    expect(res.body.reviewedBy).toBe(admin.user.id);
    expect(res.body.reviewedAt).toBeTruthy();
  });

  it("PATCH /api/reports/:id/status rejects regular user", async () => {
    const user = await registerVerifyAndLogin(uniqueEmail(), "Regular User");
    const reporter = await registerVerifyAndLogin(uniqueEmail(), "Reporter");
    const reported = await registerVerifyAndLogin(uniqueEmail(), "Reported");

    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporter.token}`)
      .send({
        targetType: "user",
        targetId: reported.user.id,
        reason: "spam",
      });

    const reportId = createRes.body.report.reportId;

    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        status: "resolved",
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });
});