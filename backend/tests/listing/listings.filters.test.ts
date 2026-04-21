// tests/listings.filters.test.ts

import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../src/app";
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

  return {
    token: res.body.token as string,
    userId: res.body.user.id as string,
  };
}

// Since there is no Product model anymore, just generate an ObjectId
// for productId and create only a Category document.
async function seedIds() {
  const category = await Category.create({
    name: `Textbooks-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  });

  return {
    productId: new mongoose.Types.ObjectId().toString(),
    categoryId: category._id.toString(),
  };
}

describe("Listings filters", () => {
  it("GET /api/listings?q= returns matching titles only", async () => {
    const { token } = await registerAndGetToken();
    const { productId, categoryId } = await seedIds();

    const matchRes = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId,
        categoryId,
        title: "Mini Fridge",
        pickUpLocation: "UMass Library",
        description: "cold and clean",
        quantity: 1,
        price: 50,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect(matchRes.status).toBe(201);

    const nonMatchRes = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId,
        categoryId,
        title: "Desk Lamp",
        pickUpLocation: "UMass Library",
        description: "bright light",
        quantity: 1,
        price: 20,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect(nonMatchRes.status).toBe(201);

    const res = await request(app).get("/api/listings?q=fridge");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    const titles = res.body.items.map((x: any) => x.title);
    expect(titles).toContain("Mini Fridge");
    expect(titles).not.toContain("Desk Lamp");
  });

  it("GET /api/listings filters by status", async () => {
    const { token } = await registerAndGetToken();
    const { productId, categoryId } = await seedIds();

    const activeRes = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId,
        categoryId,
        title: "Active Listing",
        pickUpLocation: "UMass Library",
        description: "active one",
        quantity: 1,
        price: 25,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect(activeRes.status).toBe(201);

    const soldRes = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId,
        categoryId,
        title: "Sold Listing",
        pickUpLocation: "UMass Library",
        description: "sold one",
        quantity: 1,
        price: 30,
        condition: "good",
        isNegotiable: true,
        status: "sold",
      });

    expect(soldRes.status).toBe(201);

    const res = await request(app).get("/api/listings?status=active");

    expect(res.status).toBe(200);

    const titles = res.body.items.map((x: any) => x.title);
    expect(titles).toContain("Active Listing");
    expect(titles).not.toContain("Sold Listing");
  });

  it("GET /api/listings respects limit", async () => {
    const { token } = await registerAndGetToken();
    const { productId, categoryId } = await seedIds();

    for (let i = 0; i < 3; i++) {
      const createRes = await request(app)
        .post("/api/listings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          productId,
          categoryId,
          title: `Listing ${i}`,
          pickUpLocation: "UMass Library",
          description: "paged",
          quantity: 1,
          price: 10 + i,
          condition: "good",
          isNegotiable: true,
          status: "active",
        });

      expect(createRes.status).toBe(201);
    }

    const res = await request(app).get("/api/listings?page=1&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(2);
    expect(res.body.items.length).toBe(2);
    expect(res.body.total).toBeGreaterThanOrEqual(3);
  });
});