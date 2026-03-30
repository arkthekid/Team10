import request from "supertest";
import { createApp } from "../../src/app";
import { Product } from "../../src/models/Product";
import Category from "../../src/models/Category";

const app = createApp();

async function registerUser(name: string, umassEmail: string) {
  const res = await request(app).post("/api/auth/register").send({
    name,
    umassEmail,
    password: "Test1234!",
  });

  expect(res.status).toBe(201);

  return {
    token: res.body.token as string,
    userId: (res.body.user.id ?? res.body.user._id) as string,
  };
}

async function seedProductAndCategory() {
  const product = await Product.create({
    name: "CS320 Textbook",
    description: "Like new",
    price: 30,
  });

  const category = await Category.create({
    name: "Textbooks",
  });

  return {
    productId: product._id.toString(),
    categoryId: category._id.toString(),
  };
}

async function createListingAs(token: string, overrides: Partial<any> = {}) {
  const { productId, categoryId } = await seedProductAndCategory();

  const res = await request(app)
    .post("/api/listings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      productId,
      categoryId,
      title: "Desk Lamp",
      pickUpLocation: "UMass Library",
      description: "Good condition",
      quantity: 1,
      condition: "good",
      isNegotiable: true,
      status: "active",
      ...overrides,
    });

  expect(res.status).toBe(201);
  expect(res.body._id).toBeTruthy();

  return res.body;
}

describe("Transactions", () => {
  it("POST /api/transactions without token -> 401", async () => {
    const res = await request(app).post("/api/transactions").send({
      listingId: "507f1f77bcf86cd799439011",
      finalPrice: 40,
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBeTruthy();
  });

  it("POST /api/transactions creates transaction for buyer", async () => {
    const seller = await registerUser("Seller", "seller@umass.edu");
    const buyer = await registerUser("Buyer", "buyer@umass.edu");

    const listing = await createListingAs(seller.token);

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({
        listingId: listing._id,
        finalPrice: 40,
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeTruthy();
    expect(res.body.listingId).toBeTruthy();
    expect(res.body.finalPrice).toBe(40);
    expect(res.body.status).toBe("PENDING");

    const buyerId =
      typeof res.body.buyerId === "string"
        ? res.body.buyerId
        : res.body.buyerId?._id;

    expect(buyerId).toBe(buyer.userId);
  });

  it("POST /api/transactions rejects invalid listing id -> 400", async () => {
    const buyer = await registerUser("Buyer", "buyer2@umass.edu");

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({
        listingId: "not-a-valid-objectid",
        finalPrice: 40,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid listing id/i);
  });

  it("POST /api/transactions rejects missing listing -> 404", async () => {
    const buyer = await registerUser("Buyer", "buyer3@umass.edu");

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({
        listingId: "507f1f77bcf86cd799439011",
        finalPrice: 40,
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/listing not found/i);
  });

  it("POST /api/transactions prevents buyer from buying own listing -> 400", async () => {
    const seller = await registerUser("Seller", "seller2@umass.edu");
    const listing = await createListingAs(seller.token);

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${seller.token}`)
      .send({
        listingId: listing._id,
        finalPrice: 40,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/own listing/i);
  });

  it("GET /api/transactions returns only current user's transactions", async () => {
    const seller = await registerUser("Seller", "seller3@umass.edu");
    const buyer = await registerUser("Buyer", "buyer4@umass.edu");
    const otherBuyer = await registerUser("Other Buyer", "buyer5@umass.edu");

    const listing = await createListingAs(seller.token);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({
        listingId: listing._id,
        finalPrice: 35,
      });

    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${otherBuyer.token}`)
      .send({
        listingId: listing._id,
        finalPrice: 36,
      });

    const res = await request(app)
      .get("/api/transactions?role=buyer")
      .set("Authorization", `Bearer ${buyer.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(1);

    const item = res.body.items[0];
    const buyerId =
      typeof item.buyerId === "string"
        ? item.buyerId
        : item.buyerId?._id;

    expect(buyerId).toBe(buyer.userId);
  });

  it("GET /api/transactions/:id returns transaction to buyer or seller", async () => {
    const seller = await registerUser("Seller", "seller4@umass.edu");
    const buyer = await registerUser("Buyer", "buyer6@umass.edu");

    const listing = await createListingAs(seller.token);

    const created = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({
        listingId: listing._id,
        finalPrice: 45,
      });

    expect(created.status).toBe(201);

    const res = await request(app)
      .get(`/api/transactions/${created.body._id}`)
      .set("Authorization", `Bearer ${buyer.token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(created.body._id);
  });

  it("GET /api/transactions/:id blocks unrelated user -> 403", async () => {
    const seller = await registerUser("Seller", "seller5@umass.edu");
    const buyer = await registerUser("Buyer", "buyer7@umass.edu");
    const stranger = await registerUser("Stranger", "stranger@umass.edu");

    const listing = await createListingAs(seller.token);

    const created = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({
        listingId: listing._id,
        finalPrice: 50,
      });

    const res = await request(app)
      .get(`/api/transactions/${created.body._id}`)
      .set("Authorization", `Bearer ${stranger.token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not allowed/i);
  });

  it("PATCH /api/transactions/:id/status updates status", async () => {
    const seller = await registerUser("Seller", "seller6@umass.edu");
    const buyer = await registerUser("Buyer", "buyer8@umass.edu");

    const listing = await createListingAs(seller.token);

    const created = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({
        listingId: listing._id,
        finalPrice: 55,
      });

    expect(created.status).toBe(201);

    const res = await request(app)
      .patch(`/api/transactions/${created.body._id}/status`)
      .set("Authorization", `Bearer ${seller.token}`)
      .send({ status: "COMPLETED" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("COMPLETED");
  });

  it("PATCH /api/transactions/:id/status blocks unrelated user -> 403", async () => {
    const seller = await registerUser("Seller", "seller7@umass.edu");
    const buyer = await registerUser("Buyer", "buyer9@umass.edu");
    const stranger = await registerUser("Stranger", "stranger2@umass.edu");

    const listing = await createListingAs(seller.token);

    const created = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({
        listingId: listing._id,
        finalPrice: 60,
      });

    const res = await request(app)
      .patch(`/api/transactions/${created.body._id}/status`)
      .set("Authorization", `Bearer ${stranger.token}`)
      .send({ status: "CANCELLED" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not allowed/i);
  });
});