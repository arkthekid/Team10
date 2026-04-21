import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import { Listing } from "../../src/entities/Listing";

jest.mock("../../src/services/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

const app = createApp();

const uniqueEmail = () =>
  `api-test+${Date.now()}-${Math.floor(Math.random() * 10000)}@umass.edu`;

async function registerAndVerify(email = uniqueEmail(), name = "Test User") {
  const res = await request(app).post("/api/auth/register").send({
    name,
    umassEmail: email,
    password: "Test1234!",
  });

  expect(res.status).toBe(201);

  await AppDataSource.query(
    `UPDATE "user" SET "isVerified" = true WHERE "umassEmail" = $1`,
    [email]
  );

  return { email, name };
}

describe("Auth API", () => {
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
    await AppDataSource.query(`DELETE FROM "listing"`);
    await AppDataSource.query(`DELETE FROM "user"`);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it("POST /api/auth/register creates a user and returns message + user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Gayatri",
      umassEmail: uniqueEmail(),
      password: "Test1234!",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/check your email/i);
    expect(res.body.user).toBeTruthy();
    expect(res.body.user.id).toBeTruthy();
    expect(res.body.user.name).toBe("Gayatri");
    expect(res.body.user.umassEmail).toMatch(/@umass\.edu$/);
    expect(res.body.user.role).toBe("user");
  });

  it("POST /api/auth/register rejects non-umass email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: "notumass@gmail.com",
      password: "Test1234!",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/umass/i);
  });

  it("POST /api/auth/register rejects duplicate email", async () => {
    const email = uniqueEmail();

    const first = await request(app).post("/api/auth/register").send({
      name: "First User",
      umassEmail: email,
      password: "Test1234!",
    });

    expect(first.status).toBe(201);
    expect(first.body.message).toMatch(/check your email/i);

    const second = await request(app).post("/api/auth/register").send({
      name: "Second User",
      umassEmail: email,
      password: "Test1234!",
    });

    expect(second.status).toBe(409);
    expect(second.body.message).toMatch(/already registered|email/i);
  });

  it("POST /api/auth/register rejects missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "",
      umassEmail: "",
      password: "",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it("POST /api/auth/register rejects short password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: uniqueEmail(),
      password: "123",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 8 characters/i);
  });

  it("POST /api/auth/login returns token + user for verified user", async () => {
    const { email } = await registerAndVerify(uniqueEmail(), "Login User");

    const loginRes = await request(app).post("/api/auth/login").send({
      umassEmail: email,
      password: "Test1234!",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    expect(loginRes.body.user).toBeTruthy();
    expect(loginRes.body.user.name).toBe("Login User");
    expect(loginRes.body.user.umassEmail).toBe(email);
    expect(loginRes.body.user.role).toBe("user");
  });

  it("POST /api/auth/login rejects unverified user", async () => {
    const email = uniqueEmail();
    await request(app).post("/api/auth/register").send({
      name: "Unverified User",
      umassEmail: email,
      password: "Test1234!",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      umassEmail: email,
      password: "Test1234!",
    });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.message).toMatch(/verify your email/i);
  });

  it("POST /api/auth/login rejects wrong password", async () => {
    const { email } = await registerAndVerify();

    const loginRes = await request(app).post("/api/auth/login").send({
      umassEmail: email,
      password: "WrongPassword123!",
    });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.message).toMatch(/invalid credentials/i);
  });

  it("POST /api/auth/login rejects unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      umassEmail: uniqueEmail(),
      password: "Test1234!",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it("POST /api/auth/login rejects missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({
      umassEmail: "",
      password: "",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it("POST /api/auth/login accepts email with different casing/spaces", async () => {
    const email = uniqueEmail().toLowerCase();
    await registerAndVerify(email, "Case User");

    const res = await request(app).post("/api/auth/login").send({
      umassEmail: `  ${email.toUpperCase()}  `,
      password: "Test1234!",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.umassEmail).toBe(email);
  });

  it("GET /api/auth/me returns current user with valid token", async () => {
    const { email } = await registerAndVerify(uniqueEmail(), "Me User");

    const loginRes = await request(app).post("/api/auth/login").send({
      umassEmail: email,
      password: "Test1234!",
    });

    const token = loginRes.body.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBeTruthy();
    expect(res.body.email).toBe(email);
    expect(res.body.role).toBe("user");
  });

  it("GET /api/auth/me rejects missing token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token/i);
  });
});