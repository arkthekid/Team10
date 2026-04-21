import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";

jest.mock("../../src/services/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

const app = createApp();

const uniqueEmail = () =>
  `favorite-api+${Date.now()}-${Math.floor(Math.random() * 10000)}@umass.edu`;

async function registerVerifyAndLogin(email = uniqueEmail(), name = "Favorite User") {
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

async function createListingForUser(token: string, overrides: Partial<any> = {}) {
  const res = await request(app)
    .post("/api/listings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Test Listing",
      pickUpLocation: "Campus Center",
      description: "A listing for favorite tests",
      price: 25,
      condition: "Used",
      status: "available",
      category: "Clothes",
      imageUrl: null,
      ...overrides,
    });

  expect(res.status).toBe(201);
  return res.body;
}

describe("Favorite API", () => {
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

  it("POST /api/favorites/:listingId favorites a listing", async () => {
    const { token } = await registerVerifyAndLogin();
    const listing = await createListingForUser(token);

    const res = await request(app)
      .post(`/api/favorites/${listing.listingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/favorited/i);
    expect(res.body.favorite).toBeTruthy();
    expect(res.body.favorite.listingId).toBe(listing.listingId);
  });

  it("POST /api/favorites/:listingId rejects duplicate favorite", async () => {
    const { token } = await registerVerifyAndLogin();
    const listing = await createListingForUser(token);

    const first = await request(app)
      .post(`/api/favorites/${listing.listingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/favorites/${listing.listingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(second.status).toBe(409);
    expect(second.body.message).toMatch(/already/i);
  });

  it("POST /api/favorites/:listingId rejects unknown listing", async () => {
    const { token } = await registerVerifyAndLogin();

    const res = await request(app)
      .post("/api/favorites/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/listing not found/i);
  });

  it("POST /api/favorites/:listingId rejects missing token", async () => {
    const { token } = await registerVerifyAndLogin();
    const listing = await createListingForUser(token);

    const res = await request(app).post(`/api/favorites/${listing.listingId}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token/i);
  });

  it("GET /api/favorites returns current user's favorites", async () => {
    const { token } = await registerVerifyAndLogin();
    const listing = await createListingForUser(token, { name: "Cap" });

    await request(app)
      .post(`/api/favorites/${listing.listingId}`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get("/api/favorites")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].listingId).toBe(listing.listingId);
    expect(res.body[0].name).toBe("Cap");
  });

  it("GET /api/favorites rejects missing token", async () => {
    const res = await request(app).get("/api/favorites");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token/i);
  });

  it("DELETE /api/favorites/:listingId removes favorite", async () => {
    const { token } = await registerVerifyAndLogin();
    const listing = await createListingForUser(token);

    await request(app)
      .post(`/api/favorites/${listing.listingId}`)
      .set("Authorization", `Bearer ${token}`);

    const removeRes = await request(app)
      .delete(`/api/favorites/${listing.listingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(removeRes.status).toBe(204);

    const favoritesRes = await request(app)
      .get("/api/favorites")
      .set("Authorization", `Bearer ${token}`);

    expect(favoritesRes.status).toBe(200);
    expect(favoritesRes.body).toEqual([]);
  });

  it("DELETE /api/favorites/:listingId rejects non-existent favorite", async () => {
    const { token } = await registerVerifyAndLogin();

    const res = await request(app)
      .delete("/api/favorites/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/favorite not found/i);
  });
});