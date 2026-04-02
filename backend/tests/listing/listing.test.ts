// tests/listings.test.ts
import request from "supertest";
import { createApp } from "../src/app";

import { Product } from "../src/models/Product";
import Category from "../src/models/Category";

const app = createApp();

const uniqueEmail = () => `amoemyint+${Date.now()}@umass.edu`;

async function registerAndGetToken(email = uniqueEmail()) {
  const res = await request(app).post("/api/auth/register").send({
    name: "Arkar",
    umassEmail: email,
    password: "Test1234!",
  });

  expect(res.body.token).toBeTruthy();

  // your register response returns: { token, user: { id, ... } }
  return { token: res.body.token as string, userId: res.body.user.id as string, email };
}

describe("Listings", () => {
  it("POST /api/listings without token -> 401", async () => {
    const res = await request(app).post("/api/listings").send({
      title: "No token listing",
    });

    expect(res.status).toBe(401);
  });

  it("POST /api/listings auto-sets sellerId from JWT", async () => {
    const { token, userId } = await registerAndGetToken();

    const product = await Product.create({
      name: "CS320 Textbook",
      description: "Like new",
      price: 30,
    });

    const category = await Category.create({
      name: "Textbooks",
    });

    const createRes = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        categoryId: category._id.toString(),
        title: "JWT seller test",
        pickUpLocation: "UMass Library",
        description: "sellerId should come from token",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect([200, 201]).toContain(createRes.status);
    expect(createRes.body.sellerId).toBeTruthy();

    const sellerId =
      typeof createRes.body.sellerId === "string"
        ? createRes.body.sellerId
        : createRes.body.sellerId?._id;

    expect(sellerId).toBe(userId);
  });

  it("GET /api/listings/me returns only logged-in user's listings", async () => {
    const { token } = await registerAndGetToken();
    const other = await registerAndGetToken(); // second user

    const product = await Product.create({
      name: "CS320 Textbook",
      description: "Like new",
      price: 30,
    });

    const category = await Category.create({
      name: "Textbooks",
    });

    // listing for user A
    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        categoryId: category._id.toString(),
        title: "Mine",
        pickUpLocation: "UMass Library",
        description: "my listing",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    // listing for user B
    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${other.token}`)
      .send({
        productId: product._id.toString(),
        categoryId: category._id.toString(),
        title: "Not mine",
        pickUpLocation: "UMass Library",
        description: "other listing",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    const meRes = await request(app)
      .get("/api/listings/me?page=1&limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(Array.isArray(meRes.body.items)).toBe(true);

    const titles = meRes.body.items.map((x: any) => x.title);
    expect(titles).toContain("Mine");
    expect(titles).not.toContain("Not mine");
  });

  it("GET /api/listings/me without token -> 401", async () => {
    const res = await request(app).get("/api/listings/me");
    expect(res.status).toBe(401);
  });
});