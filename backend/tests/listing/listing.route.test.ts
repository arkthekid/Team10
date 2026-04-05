import request from "supertest";
import express from "express";
import router from "../../src/routes/listingRoutes";
import * as listingController from "../../src/controllers/listingController";
import { protect } from "../../src/middleware/auth";

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
    req.user = { id: "user123", email: "user@umass.edu", role: "user" };
    next();
  }),
}));

const app = express();
app.use(express.json());
app.use("/listings", router);

describe("listingRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /listings routes to getListings controller", async () => {
    const res = await request(app).get("/listings");

    expect(res.status).toBe(200);
    expect(listingController.getListings).toHaveBeenCalled();
    expect(protect).not.toHaveBeenCalled();
  });

  it("GET /listings/me routes through protect and then getMyListings", async () => {
    const res = await request(app).get("/listings/me");

    expect(res.status).toBe(200);
    expect(protect).toHaveBeenCalled();
    expect(listingController.getMyListings).toHaveBeenCalled();
  });

  it("GET /listings/me should not route to getListingById", async () => {
    await request(app).get("/listings/me");

    expect(listingController.getMyListings).toHaveBeenCalled();
    expect(listingController.getListingById).not.toHaveBeenCalled();
  });

  it("GET /listings/:id routes to getListingById controller", async () => {
    const res = await request(app).get("/listings/123");

    expect(res.status).toBe(200);
    expect(listingController.getListingById).toHaveBeenCalled();
    expect(protect).not.toHaveBeenCalled();
  });

  it("POST /listings routes through protect and then createListing", async () => {
    const res = await request(app)
      .post("/listings")
      .send({ name: "Desk", price: 120 });

    expect(res.status).toBe(201);
    expect(protect).toHaveBeenCalled();
    expect(listingController.createListing).toHaveBeenCalled();
  });

  it("PATCH /listings/:id routes through protect and then updateListing", async () => {
    const res = await request(app)
      .patch("/listings/123")
      .send({ name: "Updated Desk" });

    expect(res.status).toBe(200);
    expect(protect).toHaveBeenCalled();
    expect(listingController.updateListing).toHaveBeenCalled();
  });

  it("DELETE /listings/:id routes through protect and then deleteListing", async () => {
    const res = await request(app).delete("/listings/123");

    expect(res.status).toBe(204);
    expect(protect).toHaveBeenCalled();
    expect(listingController.deleteListing).toHaveBeenCalled();
  });
});