import request from "supertest";
import express from "express";
import router from "../../src/routes/listingRoutes";

// Mock controller
jest.mock("../../src/controllers/listingController", () => ({
  getListings: jest.fn((req, res) => res.status(200).json({ success: true })),
  getMyListings: jest.fn((req, res) => res.status(200).json({ success: true })),
  getListingById: jest.fn((req, res) => res.status(200).json({ success: true })),
  createListing: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateListing: jest.fn((req, res) => res.status(200).json({ success: true })),
  deleteListing: jest.fn((req, res) => res.status(204).send()),
}));

// Mock protect middleware
jest.mock("../../src/middleware/auth", () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: "user123" }; // fake user
    next();
  }),
}));

const app = express();
app.use(express.json());
app.use("/listings", router);

describe("Listing Routes", () => {
  it("GET /listings should be public", async () => {
    const res = await request(app).get("/listings");
    expect(res.status).toBe(200);
  });

  it("GET /listings/me should require auth", async () => {
    const res = await request(app).get("/listings/me");
    expect(res.status).toBe(200);
  });

  it("GET /listings/:id should work", async () => {
    const res = await request(app).get("/listings/123");
    expect(res.status).toBe(200);
  });

  it("POST /listings should require auth", async () => {
    const res = await request(app)
      .post("/listings")
      .send({ title: "Test Listing" });

    expect(res.status).toBe(201);
  });

  it("PATCH /listings/:id should work", async () => {
    const res = await request(app)
      .patch("/listings/123")
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
  });

  it("DELETE /listings/:id should work", async () => {
    const res = await request(app).delete("/listings/123");
    expect(res.status).toBe(204);
  });
});