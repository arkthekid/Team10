// tests/routes/product.routes.more.test.ts

// Covers product route wiring only. 
// tests that the product routes are connected correctly to the right controller functions
// uses mocked controllers and checks that when someone hits the GET all products route, GET one product route, or DELETE product route, the app responds through the correct route handler

import request from "supertest";
import express from "express";
import productRoutes from "../../src/routes/productRoutes";

// Mock controller methods so this file only tests route wiring
jest.mock("../../src/controllers/productControllers", () => ({
  createProduct: jest.fn((req, res) => {
    res.status(201).json({ message: "Mocked product created" });
  }),
  getAllProducts: jest.fn((req, res) => {
    res.status(200).json({ message: "Mocked get all products" });
  }),
  getProductByID: jest.fn((req, res) => {
    res.status(200).json({ message: "Mocked get product by id" });
  }),
  updateProduct: jest.fn((req, res) => {
    res.status(200).json({ message: "Mocked product updated" });
  }),
  deleteProduct: jest.fn((req, res) => {
    res.status(200).json({ message: "Mocked product deleted" });
  }),
}));

describe("Product Routes - more", () => {
  // Small isolated app just for testing these routes
  const app = express();

  app.use(express.json());
  app.use("/products", productRoutes);

  it("GET /products should call getAllProducts controller", async () => {
    const res = await request(app).get("/products");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Mocked get all products");
  });

  it("GET /products/:id should call getProductByID controller", async () => {
    const res = await request(app).get("/products/123");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Mocked get product by id");
  });

  it("DELETE /products/:id should call deleteProduct controller", async () => {
    const res = await request(app).delete("/products/123");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Mocked product deleted");
  });
});