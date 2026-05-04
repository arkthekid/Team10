import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";

jest.mock("../../src/services/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

const app = createApp();

const uniqueEmail = () =>
  `amoemyint+${Date.now()}-${Math.floor(Math.random() * 10000)}@umass.edu`;

async function registerAndVerify(email = uniqueEmail()) {
  const res = await request(app).post("/api/auth/register").send({
    name: "Arkar",
    umassEmail: email,
    password: "Test1234!",
  });

  expect(res.status).toBe(201);

  await AppDataSource.query(
    `UPDATE "user" SET "isVerified" = true WHERE "umassEmail" = $1`,
    [email],
  );

  return { email };
}

describe("Auth", () => {
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

  it("POST /api/auth/register returns message + user", async () => {
    const email = uniqueEmail();

    const res = await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: email,
      password: "Test1234!",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/check your email/i);
    expect(res.body.user).toBeTruthy();
    expect(res.body.user.umassEmail).toBe(email);
  });

  it("POST /api/auth/register duplicate email fails", async () => {
    const email = uniqueEmail();

    await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: email,
      password: "Test1234!",
    });

    const res2 = await request(app).post("/api/auth/register").send({
      name: "Arkar2",
      umassEmail: email,
      password: "Test1234!",
    });

    expect(res2.status).toBe(409);
    expect(res2.body.message).toMatch(/already registered|already/i);
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

  it("POST /api/auth/register non-umass email fails", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: "arkar@gmail.com",
      password: "Test1234!",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
  });

  it("POST /api/auth/login returns token for verified user", async () => {
    const { email } = await registerAndVerify();

    const res = await request(app).post("/api/auth/login").send({
      umassEmail: email,
      password: "Test1234!",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.umassEmail).toBe(email);
  });

  it("POST /api/auth/login rejects unverified user", async () => {
    const email = uniqueEmail();
    await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: email,
      password: "Test1234!",
    });

    const res = await request(app).post("/api/auth/login").send({
      umassEmail: email,
      password: "Test1234!",
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/verify your email/i);
  });

  it("POST /api/auth/login wrong password fails", async () => {
    const { email } = await registerAndVerify();

    const res = await request(app).post("/api/auth/login").send({
      umassEmail: email,
      password: "WrongPassword!",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBeTruthy();
  });

  it("POST /api/auth/login rejects missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({
      umassEmail: "",
      password: "",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it("POST /api/auth/login non-existing email fails", async () => {
    const res = await request(app).post("/api/auth/login").send({
      umassEmail: "doesnotexist@umass.edu",
      password: "Test1234!",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBeTruthy();
  });

  it("GET /api/auth/me returns current user", async () => {
    const { email } = await registerAndVerify();

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
