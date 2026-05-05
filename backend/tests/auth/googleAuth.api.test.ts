import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import { Listing } from "../../src/entities/Listing";

jest.mock("../../src/services/googleAuthService");

import * as googleAuthService from "../../src/services/googleAuthService";

const app = createApp();

const mockGoogleLogin = googleAuthService.googleLogin as jest.Mock;

const fakeUser = (email: string) => ({
  token: "fake-jwt-token",
  user: {
    id: "some-uuid",
    name: "Arkar",
    umassEmail: email,
    role: "user",
  },
});

describe("Google OAuth API", () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  beforeEach(async () => {
    await AppDataSource.query(`DELETE FROM "message"`);
    await AppDataSource.query(`DELETE FROM "conversation"`);
    await AppDataSource.query(`DELETE FROM "report"`);
    await AppDataSource.query(`DELETE FROM "review"`);
    await AppDataSource.query(`DELETE FROM "favorite"`);
    await AppDataSource.query(`DELETE FROM "block"`);
    await AppDataSource.query(
      `DELETE FROM "listing_categories_category_entity"`,
    );
    await AppDataSource.query(`DELETE FROM "listing_image"`);
    await AppDataSource.query(`DELETE FROM "listing"`);
    await AppDataSource.query(`DELETE FROM "user"`);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  // Success case
  it("POST /api/auth/google returns token for valid UMass account", async () => {
    const email = `googletest+${Date.now()}@umass.edu`;
    mockGoogleLogin.mockResolvedValue(fakeUser(email));

    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "fake-google-token" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.umassEmail).toBe(email);
    expect(res.body.user.name).toBe("Arkar");
    expect(res.body.user.role).toBe("user");
  });

  // Success case - existing user
  it("POST /api/auth/google returns token for already registered UMass account", async () => {
    const email = `googletest+${Date.now()}@umass.edu`;
    mockGoogleLogin.mockResolvedValue(fakeUser(email));

    const first = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "fake-google-token" });

    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "fake-google-token" });

    expect(second.status).toBe(200);
    expect(second.body.user.umassEmail).toBe(email);
  });

  // Error case - missing token
  it("POST /api/auth/google returns 400 when idToken is missing", async () => {
    const res = await request(app).post("/api/auth/google").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Google ID token is required/i);
  });

  // Error case - non umass email
  it("POST /api/auth/google returns 403 for non-umass email", async () => {
    const { AppError } = await import("../../src/utils/AppError");
    mockGoogleLogin.mockRejectedValue(
      new AppError("Must use a @umass.edu Google account", 403),
    );

    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "fake-google-token" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/umass\.edu/i);
  });

  // Edge case - invalid Google token
  it("POST /api/auth/google returns 401 for invalid Google token", async () => {
    const { AppError } = await import("../../src/utils/AppError");
    mockGoogleLogin.mockRejectedValue(
      new AppError("Invalid Google token", 401),
    );

    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "bad-token" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid Google token/i);
  });

  // Edge case - Google returns no payload
  it("POST /api/auth/google returns 401 when Google payload is null", async () => {
    const { AppError } = await import("../../src/utils/AppError");
    mockGoogleLogin.mockRejectedValue(
      new AppError("Invalid Google token", 401),
    );

    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "fake-google-token" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid Google token/i);
  });
});
