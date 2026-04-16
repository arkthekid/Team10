import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import { Listing } from "../../src/entities/Listing";

const app = createApp();

const uniqueEmail = () => `amoemyint+${Date.now()}@umass.edu`;

describe("Auth", () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  beforeEach(async () => {
    await AppDataSource.createQueryBuilder().delete().from(Listing).execute();
    await AppDataSource.createQueryBuilder().delete().from(User).execute();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it("POST /api/auth/register returns token + user", async () => {
    const email = uniqueEmail();

    const res = await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: email,
      password: "Test1234!",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
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

  it("POST /api/auth/login returns token", async () => {
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

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.umassEmail).toBe(email);
  });

  it("POST /api/auth/login wrong password fails", async () => {
    const email = uniqueEmail();

    await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: email,
      password: "Test1234!",
    });

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
    const email = uniqueEmail();
    const password = "Test1234!";

    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Me User",
      umassEmail: email,
      password,
    });

    const token = registerRes.body.token;

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