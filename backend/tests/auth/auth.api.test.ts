import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

const uniqueEmail = () => `api-test+${Date.now()}-${Math.floor(Math.random() * 10000)}@umass.edu`;

describe("Auth API", () => {
  it("POST /api/auth/register creates a user and returns token + user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Gayatri",
      umassEmail: uniqueEmail(),
      password: "Test1234!",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toBeTruthy();
    expect(res.body.user.id).toBeTruthy();
    expect(res.body.user.name).toBe("Arkar");
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
    expect(first.body.token).toBeTruthy();

    const second = await request(app).post("/api/auth/register").send({
      name: "Second User",
      umassEmail: email,
      password: "Test1234!",
    });

    expect(second.status).toBe(409);
    expect(second.body.message).toMatch(/already registered|email/i);
  });

  it("POST /api/auth/login returns token + user for valid credentials", async () => {
    const email = uniqueEmail();
    const password = "Test1234!";

    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Login User",
      umassEmail: email,
      password,
    });

    expect(registerRes.status).toBe(201);

    const loginRes = await request(app).post("/api/auth/login").send({
      umassEmail: email,
      password,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    expect(loginRes.body.user).toBeTruthy();
    expect(loginRes.body.user.name).toBe("Login User");
    expect(loginRes.body.user.umassEmail).toBe(email);
    expect(loginRes.body.user.role).toBe("user");
  });

  it("POST /api/auth/login rejects wrong password", async () => {
    const email = uniqueEmail();

    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Wrong Password User",
      umassEmail: email,
      password: "Test1234!",
    });

    expect(registerRes.status).toBe(201);

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
});
