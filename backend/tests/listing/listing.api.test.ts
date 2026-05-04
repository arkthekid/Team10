import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";

jest.mock("../../src/services/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

const app = createApp();

const uniqueEmail = () =>
  `amoemyint+${Date.now()}-${Math.floor(Math.random() * 10000)}@umass.edu`;

async function registerAndGetToken(email = uniqueEmail()) {
  const registerRes = await request(app).post("/api/auth/register").send({
    name: "Arkar",
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
  expect(loginRes.body.token).toBeTruthy();

  return {
    token: loginRes.body.token as string,
    userId: loginRes.body.user.id as string,
    email,
  };
}

describe("Listings API", () => {
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

  it("POST /api/listings without token -> 401", async () => {
    const res = await request(app).post("/api/listings").send({
      name: "No token listing",
      pickUpLocation: "UMass",
      description: "Should fail",
      price: 50,
      condition: "good",
      categoryIds: [],
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token|invalid token/i);
  });

  it.skip("POST /api/listings auto-sets sellerId from JWT", async () => {
    // Skipped: depends on email/password login which is removed
  });

  it.skip("GET /api/listings/me returns only logged-in user's listings", async () => {
    // Skipped: depends on email/password login which is removed
  });

  it("GET /api/listings/me without token -> 401", async () => {
    const res = await request(app).get("/api/listings/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token|invalid token/i);
  });

  it.skip("PATCH /api/listings/:id updates listing for owner", async () => {
    // Skipped: depends on email/password login which is removed
  });

  it.skip("DELETE /api/listings/:id deletes listing for owner", async () => {
    // Skipped: depends on email/password login which is removed
  });
});