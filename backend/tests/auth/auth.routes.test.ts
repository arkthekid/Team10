import request from "supertest";
import express from "express";
import authRoutes from "../../src/routes/authRoutes";
import * as authController from "../../src/controllers/authController";

jest.mock("../../src/controllers/authController");
jest.mock("../../src/middleware/auth", () => ({
  protect: (req: any, res: any, next: any) => next(),
}));

describe("authRoutes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/auth/register calls register controller", async () => {
    (authController.register as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json({ message: "ok" });
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Arkar",
      umassEmail: "arkar@umass.edu",
      password: "Test1234!",
    });

    expect(res.status).toBe(201);
    expect(authController.register).toHaveBeenCalled();
  });

  it("POST /api/auth/login calls login controller", async () => {
    (authController.login as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ message: "ok" });
    });

    const res = await request(app).post("/api/auth/login").send({
      umassEmail: "arkar@umass.edu",
      password: "Test1234!",
    });

    expect(res.status).toBe(200);
    expect(authController.login).toHaveBeenCalled();
  });

  it("GET /api/auth/me calls getMe controller", async () => {
    (authController.getMe as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({
        id: "123",
        email: "arkar@umass.edu",
        role: "user",
      });
    });

    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(authController.getMe).toHaveBeenCalled();
  });

  it("POST /api/auth/google calls googleAuth controller", async () => {
    (authController.googleAuth as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ token: "fake-jwt" });
    });

    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "fake-token" });

    expect(res.status).toBe(200);
    expect(authController.googleAuth).toHaveBeenCalled();
  });

  it("GET /api/auth/verify-email calls verifyEmailController", async () => {
    (authController.verifyEmailController as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ token: "fake-jwt" });
    });

    const res = await request(app).get("/api/auth/verify-email?token=fake-token");

    expect(res.status).toBe(200);
    expect(authController.verifyEmailController).toHaveBeenCalled();
  });

  it("GET /api/auth/logout calls logout controller", async () => {
    (authController.logout as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ message: "logged out" });
    });

    const res = await request(app).get("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(authController.logout).toHaveBeenCalled();
  });
});