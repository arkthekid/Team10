// tests/seller.controller.test.ts
import request from "supertest";
import { createApp } from "../../src/app";
import Seller from "../../src/models/Seller";

const app = createApp();

describe("Seller Controller", () => {
  it("POST /api/sellers returns 201 on success (mocked)", async () => {
    const spy = jest.spyOn(Seller, "create").mockResolvedValueOnce({
      _id: "s1",
      name: "Arkar",
    } as any);

    const res = await request(app).post("/api/sellers").send({ name: "Arkar" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Arkar");

    spy.mockRestore();
  });

  it("POST /api/sellers returns 400 when Seller.create throws", async () => {
    const spy = jest.spyOn(Seller, "create").mockRejectedValueOnce(new Error("boom"));

    const res = await request(app).post("/api/sellers").send({ name: "Anyone" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/boom/i);

    spy.mockRestore();
  });
});