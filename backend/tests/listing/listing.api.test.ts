import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import { Listing } from "../../src/entities/Listing";

const app = createApp();

const uniqueEmail = () =>
  `amoemyint+${Date.now()}-${Math.floor(Math.random() * 10000)}@umass.edu`;

async function registerAndGetToken(email = uniqueEmail()) {
  const res = await request(app).post("/api/auth/register").send({
    name: "Arkar",
    umassEmail: email,
    password: "Test1234!",
  });

  expect(res.status).toBe(201);
  expect(res.body.token).toBeTruthy();

  return {
    token: res.body.token as string,
    userId: res.body.user.id as string,
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
    await AppDataSource.createQueryBuilder().delete().from(Listing).execute();
    await AppDataSource.createQueryBuilder().delete().from(User).execute();
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
      category: "textbooks",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token|invalid token/i);
  });

  it("POST /api/listings auto-sets sellerId from JWT", async () => {
    const { token, userId } = await registerAndGetToken();

    const createRes = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "JWT seller test",
        pickUpLocation: "UMass Library",
        description: "sellerId should come from token",
        price: 30,
        condition: "good",
        category: "textbooks",
        sellerId: "fake-user-id",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.sellerId).toBe(userId);
    expect(createRes.body.name).toBe("JWT seller test");
  });

  it("GET /api/listings/me returns only logged-in user's listings", async () => {
    const userA = await registerAndGetToken();
    const userB = await registerAndGetToken();

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        name: "Mine",
        pickUpLocation: "UMass Library",
        description: "my listing",
        price: 25,
        condition: "good",
        category: "textbooks",
      });

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${userB.token}`)
      .send({
        name: "Not mine",
        pickUpLocation: "UMass Library",
        description: "other listing",
        price: 40,
        condition: "good",
        category: "textbooks",
      });

    const meRes = await request(app)
      .get("/api/listings/me")
      .set("Authorization", `Bearer ${userA.token}`);

    expect(meRes.status).toBe(200);
    expect(Array.isArray(meRes.body)).toBe(true);

    const names = meRes.body.map((x: any) => x.name);
    expect(names).toContain("Mine");
    expect(names).not.toContain("Not mine");
  });

  it("GET /api/listings/me without token -> 401", async () => {
    const res = await request(app).get("/api/listings/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token|invalid token/i);
  });

  it("PATCH /api/listings/:id updates listing for owner", async () => {
    const { token } = await registerAndGetToken();

    const createRes = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Old Desk",
        pickUpLocation: "UMass",
        description: "Old description",
        price: 100,
        condition: "used",
        category: "furniture",
      });

    const listingId = createRes.body.listingId;

    const patchRes = await request(app)
      .patch(`/api/listings/${listingId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Desk",
        price: 150,
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.listingId).toBe(listingId);
    expect(patchRes.body.name).toBe("Updated Desk");
    expect(patchRes.body.price).toBe(150);
  });

  it("DELETE /api/listings/:id deletes listing for owner", async () => {
    const { token } = await registerAndGetToken();

    const createRes = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Desk to delete",
        pickUpLocation: "UMass",
        description: "Delete me",
        price: 75,
        condition: "used",
        category: "furniture",
      });

    const listingId = createRes.body.listingId;

    const deleteRes = await request(app)
      .delete(`/api/listings/${listingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);

    const getRes = await request(app).get(`/api/listings/${listingId}`);
    expect(getRes.status).toBe(404);
  });
});