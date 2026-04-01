// tests/listings.ownership.test.ts

import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../src/app";
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
    const owner = await registerAndGetToken();
    const other = await registerAndGetToken();

    const category = await Category.create({
      name: `Furniture-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    });

    // No Product model now, so use a raw ObjectId string
    const productId = new mongoose.Types.ObjectId().toString();

    const created = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        productId,
        categoryId: category._id.toString(),
        title: "Original Owner Listing",
        pickUpLocation: "UMass",
        description: "test",
        quantity: 1,
        price: 25,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect(created.status).toBe(201);

    const id = created.body._id ?? created.body.id;
    expect(id).toBeTruthy();

    const updated = await request(app)
      .patch(`/api/listings/${id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Still Mine",
        sellerId: other.userId,
      });

    expect(updated.status).toBe(200);

    const sellerId =
      typeof updated.body.sellerId === "string"
        ? updated.body.sellerId
        : updated.body.sellerId?._id;

    expect(sellerId).toBe(owner.userId);
    expect(sellerId).not.toBe(other.userId);
    expect(updated.body.title).toBe("Still Mine");
  });
});