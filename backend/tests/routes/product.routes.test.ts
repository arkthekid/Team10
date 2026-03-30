import request from "supertest";
import express from "express";
import productRoutes from "../../src/routes/productRoutes";

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

describe("Product Routes", () => {
  const app = express();

  app.use(express.json());
  app.use("/products", productRoutes);

  it("POST /products should call createProduct controller", async () => {
    const response = await request(app)
      .post("/products")
      .send({
        name: "Test Product",
        categoryId: "507f1f77bcf86cd799439011",
        price: 100,
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Mocked product created");
  });
});