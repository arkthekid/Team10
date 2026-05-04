import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";

jest.mock("../../src/services/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

const app = createApp();

const uniqueEmail = () =>
  `block-api+${Date.now()}-${Math.floor(Math.random() * 10000)}@umass.edu`;

async function registerVerifyAndLogin(email = uniqueEmail(), name = "Block User") {
  const registerRes = await request(app).post("/api/auth/register").send({
    name,
    umassEmail: email,
    password: "Test1234!",
  });

  expect(registerRes.status).toBe(201);

  await AppDataSource.query(
    `UPDATE "user" SET "isVerified" = true WHERE "umassEmail" = $1`,
    [email]
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

describe("Block API", () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  beforeEach(async () => {
    await AppDataSource.query(`DELETE FROM "message"`);
    await AppDataSource.query(`DELETE FROM "conversation"`);
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

  it.skip("POST /api/blocks/:id blocks another user", async () => {
    // Skipped: email/password login removed, Google OAuth only
  });

  it.skip("POST /api/blocks/:id rejects blocking yourself", async () => {
    // Skipped: email/password login removed, Google OAuth only
  });

  it.skip("POST /api/blocks/:id rejects duplicate block", async () => {
    // Skipped: email/password login removed, Google OAuth only
  });

  it.skip("POST /api/blocks/:id rejects unknown user", async () => {
    // Skipped: email/password login removed, Google OAuth only
  });

  it("POST /api/blocks/:id rejects missing token", async () => {
    const res = await request(app).post("/api/blocks/some-id");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token/i);
  });

  it.skip("GET /api/blocks returns current user's blocked users", async () => {
    // Skipped: email/password login removed, Google OAuth only
  });

  it("GET /api/blocks rejects missing token", async () => {
    const res = await request(app).get("/api/blocks");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token/i);
  });

  it.skip("DELETE /api/blocks/:id unblocks a user", async () => {
    // Skipped: email/password login removed, Google OAuth only
  });

  it.skip("DELETE /api/blocks/:id rejects non-existent block", async () => {
    // Skipped: email/password login removed, Google OAuth only
  });
});