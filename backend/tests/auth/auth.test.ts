import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source"; // ✅ ADDED: needed to initialize DB for API tests
import { User } from "../../src/entities/User"; // ✅ ADDED: needed to clear user data between tests

const app = createApp();

const uniqueEmail = () => `amoemyint+${Date.now()}@umass.edu`;

describe("Auth", () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize(); 
      // ✅ ADDED: initialize database connection before tests run
      // prevents 500 errors when hitting endpoints that use the DB
    }
  });

  beforeEach(async () => {
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.clear(); 
    // ✅ ADDED: clear users before each test
    // ensures tests don’t interfere with each other (e.g., duplicate emails)
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy(); 
      // ✅ ADDED: close DB connection after tests
      // prevents open handles / memory leaks in Jest
    }
  });

  it("POST /api/auth/register returns token + user", async () => {
    const email = uniqueEmail();

    const res = await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: email,
      password: "Test1234!",
    });

    expect([200, 201]).toContain(res.status);
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

    expect([400, 409]).toContain(res2.status);
    expect(res2.body.message).toMatch(/already registered|already/i);
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

    expect([400, 401]).toContain(res.status);
    expect(res.body.message).toBeTruthy();
  });

  it("POST /api/auth/register non-umass email fails", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: "arkar@gmail.com",
      password: "Test1234!",
    });

    expect([400, 422]).toContain(res.status);
    expect(res.body.message).toBeTruthy();
  });

  it("POST /api/auth/login non-existing email fails", async () => {
    const res = await request(app).post("/api/auth/login").send({
      umassEmail: "doesnotexist@umass.edu",
      password: "Test1234!",
    });

    expect([401, 400]).toContain(res.status);
    expect(res.body.message).toBeTruthy();
  });
});