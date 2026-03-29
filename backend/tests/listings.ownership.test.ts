// tests/listings.ownership.test.ts

// tests listing security
// makes sure that the owner of a listing cannot be changed just by sending a fake sellerId in the request body
// even if someone tries to tamper with the request, the backend should keep the real seller attached to the listing

import request from "supertest";
import { createApp } from "../src/app";
import { Product } from "../src/models/Product";
import Category from "../src/models/Category";

// Build app once for this test file
const app = createApp();

// Helper to avoid duplicate email collisions
const uniqueEmail = () => `amoemyint+${Date.now()}@umass.edu`;

// Helper: register a user and get token + id
async function registerAndGetToken(email = uniqueEmail()) {
  const res = await request(app).post("/api/auth/register").send({
    name: "Gayatri",
    umassEmail: email,
    password: "Test1234!",
  });

  expect(res.body.token).toBeTruthy();

  return {
    token: res.body.token as string,
    userId: res.body.user.id as string,
  };
}

describe("Listings ownership", () => {
  it("PATCH /api/listings/:id ignores sellerId in request body", async () => {
    // Owner creates the listing
    const owner = await registerAndGetToken();

    // Another user tries to become the seller through request body tampering
    const other = await registerAndGetToken();

    // Create dependencies needed by listing
    const product = await Product.create({
      name: "Chair",
      productID: Math.floor(Math.random() * 100000),
      listingID: 1,
      categoryID: 1,
      price: 25,
    });

    const category = await Category.create({
      name: `Furniture-${Date.now()}`,
    });

    // Create the listing as the owner
    const created = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        productId: product._id.toString(),
        categoryId: category._id.toString(),
        title: "Original Owner Listing",
        pickUpLocation: "UMass",
        description: "test",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect([200, 201]).toContain(created.status);

    const id = created.body._id ?? created.body.id;

    // Owner updates the listing, but tries to inject a different sellerId
    const updated = await request(app)
      .patch(`/api/listings/${id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Still Mine",
        sellerId: other.userId,
      });

    expect(updated.status).toBe(200);

    // Response may return sellerId as a string or populated object
    const sellerId =
      typeof updated.body.sellerId === "string"
        ? updated.body.sellerId
        : updated.body.sellerId?._id;

    // sellerId should remain the real owner, not the injected one
    expect(sellerId).toBe(owner.userId);
  });
});