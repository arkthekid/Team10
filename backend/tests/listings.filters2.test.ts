// Tests additional listing browse behavior:
// - filtering by condition
// - filtering by category
// - sorting listings by title in ascending order

import request from "supertest";
import { createApp } from "../src/app";
import { Product } from "../src/models/Product";
import Category from "../src/models/Category";

const app = createApp();

const uniqueEmail = () => `amoemyint+${Date.now()}@umass.edu`;

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

async function createProduct(name: string, price = 30) {
  const product = await Product.create({
    name,
    productID: Math.floor(Math.random() * 100000),
    listingID: 1,
    categoryID: 1,
    price,
  });

  return product;
}

describe("Listings - more filters and sorting", () => {
  it("GET /api/listings filters by condition", async () => {
    const { token } = await registerAndGetToken();

    const product = await createProduct("Condition Product");
    const category = await Category.create({
      name: `Condition-${Date.now()}`,
    });

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        categoryId: category._id.toString(),
        title: "Good Listing",
        pickUpLocation: "UMass Library",
        description: "good condition listing",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        categoryId: category._id.toString(),
        title: "Fair Listing",
        pickUpLocation: "UMass Library",
        description: "fair condition listing",
        quantity: 1,
        condition: "fair",
        isNegotiable: true,
        status: "active",
      });

    const res = await request(app).get("/api/listings?condition=good");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    const titles = res.body.items.map((x: any) => x.title);
    expect(titles).toContain("Good Listing");
    expect(titles).not.toContain("Fair Listing");
  });

  it("GET /api/listings filters by category", async () => {
    const { token } = await registerAndGetToken();

    const product = await createProduct("Category Product");

    const categoryA = await Category.create({
      name: `Textbooks-${Date.now()}`,
    });

    const categoryB = await Category.create({
      name: `Furniture-${Date.now()}`,
    });

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        categoryId: categoryA._id.toString(),
        title: "Book Listing",
        pickUpLocation: "UMass Library",
        description: "belongs to textbooks",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        categoryId: categoryB._id.toString(),
        title: "Chair Listing",
        pickUpLocation: "UMass Library",
        description: "belongs to furniture",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    const res = await request(app).get(
      `/api/listings?category=${categoryA._id.toString()}`
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    const titles = res.body.items.map((x: any) => x.title);
    expect(titles).toContain("Book Listing");
    expect(titles).not.toContain("Chair Listing");
  });

  it("GET /api/listings sorts by title ascending", async () => {
    const { token } = await registerAndGetToken();

    const product = await createProduct("Sort Product");
    const category = await Category.create({
      name: `Sort-${Date.now()}`,
    });

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        categoryId: category._id.toString(),
        title: "Zebra",
        pickUpLocation: "UMass Library",
        description: "z item",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        categoryId: category._id.toString(),
        title: "Apple",
        pickUpLocation: "UMass Library",
        description: "a item",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        categoryId: category._id.toString(),
        title: "Notebook",
        pickUpLocation: "UMass Library",
        description: "n item",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    const res = await request(app).get("/api/listings?sort=title_asc");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    const titles = res.body.items.map((x: any) => x.title);

    expect(titles.indexOf("Apple")).toBeLessThan(titles.indexOf("Notebook"));
    expect(titles.indexOf("Notebook")).toBeLessThan(titles.indexOf("Zebra"));
  });
});