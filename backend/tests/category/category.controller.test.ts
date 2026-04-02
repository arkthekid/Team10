// tests/category.controller.test.ts
import request from "supertest";
import { createApp } from "../../src/app";
import Category from "../../src/models/Category";

const app = createApp();

describe("Category Controller", () => {
  it("POST /api/categories creates category (201)", async () => {
    const res = await request(app).post("/api/categories").send({ name: "Textbooks" });

    expect(res.status).toBe(201);
    expect(res.body).toBeTruthy();
    expect(res.body.name).toBe("Textbooks");
  });

  it("POST /api/categories returns 400 when Category.create throws", async () => {
    const spy = jest.spyOn(Category, "create").mockRejectedValueOnce(new Error("boom"));

    const res = await request(app).post("/api/categories").send({ name: "Anything" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/boom/i);

    spy.mockRestore();
  });
});