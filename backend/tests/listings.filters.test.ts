// tests/listings.filters.test.ts

// Covers listing browsing behavior
// tests whether the API returns the correct listings when someone searches or filters
// checks that a keyword search only returns matching listings, that filtering by status like active works correctly
// checks that pagination works when a limit is set

import request from "supertest";
import { createApp } from "../src/app";
import { Product } from "../src/models/Product";
import Category from "../src/models/Category";

// Build app once for this file
const app = createApp();

// Fresh email helper so register calls do not collide
const uniqueEmail = () => `amoemyint+${Date.now()}@umass.edu`;

// Helper: register a user and return auth token + user id
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

// Helper: create one product and one category to attach to listings
async function seedProductAndCategory() {
  const product = await Product.create({
    name: "Book",
    productID: Math.floor(Math.random() * 100000),
    listingID: 1,
    categoryID: 1,
    price: 30,
  });

  const category = await Category.create({
    name: `Textbooks-${Date.now()}`,
  });

  return {
    productId: product._id.toString(),
    categoryId: category._id.toString(),
  };
}

describe("Listings filters", () => {
  it("GET /api/listings?q= returns matching titles only", async () => {
    const { token } = await registerAndGetToken();
    const { productId, categoryId } = await seedProductAndCategory();

    // Listing that SHOULD match the search
    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId,
        categoryId,
        title: "Mini Fridge",
        pickUpLocation: "UMass Library",
        description: "cold and clean",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    // Listing that should NOT match the search
    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId,
        categoryId,
        title: "Desk Lamp",
        pickUpLocation: "UMass Library",
        description: "bright light",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    // Search by keyword
    const res = await request(app).get("/api/listings?q=fridge");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    // Verify only the matching listing appears
    const titles = res.body.items.map((x: any) => x.title);
    expect(titles).toContain("Mini Fridge");
    expect(titles).not.toContain("Desk Lamp");
  });

  it("GET /api/listings filters by status", async () => {
    const { token } = await registerAndGetToken();
    const { productId, categoryId } = await seedProductAndCategory();

    // Active listing
    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId,
        categoryId,
        title: "Active Listing",
        pickUpLocation: "UMass Library",
        description: "active one",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    // Sold listing
    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId,
        categoryId,
        title: "Sold Listing",
        pickUpLocation: "UMass Library",
        description: "sold one",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "sold",
      });

    // Ask only for active listings
    const res = await request(app).get("/api/listings?status=active");

    expect(res.status).toBe(200);

    const titles = res.body.items.map((x: any) => x.title);
    expect(titles).toContain("Active Listing");
    expect(titles).not.toContain("Sold Listing");
  });

  it("GET /api/listings respects limit", async () => {
    const { token } = await registerAndGetToken();
    const { productId, categoryId } = await seedProductAndCategory();

    // Create 3 listings
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/listings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          productId,
          categoryId,
          title: `Listing ${i}`,
          pickUpLocation: "UMass Library",
          description: "paged",
          quantity: 1,
          condition: "good",
          isNegotiable: true,
          status: "active",
        });
    }

    // Request only 2 per page
    const res = await request(app).get("/api/listings?page=1&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(2);
    expect(res.body.items.length).toBe(2);
    expect(res.body.total).toBeGreaterThanOrEqual(3);
  });
});