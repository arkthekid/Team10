import request from "supertest";
import { createApp } from "../../src/app";
import { Product } from "../../src/models/Product";
import Category from "../../src/models/Category";

const app = createApp();

// helper: register + return token + userId
async function reg(email: string) {
  const res = await request(app).post("/api/auth/register").send({
    name: "User",
    umassEmail: email,
    password: "Test1234!",
  });

  expect(res.body.token).toBeTruthy();
  return { token: res.body.token as string, userId: res.body.user.id as string };
}

async function seedProductCategory() {
  const product = await Product.create({
    name: "CS320 Textbook",
    description: "Like new",
    price: 30,
  });

  const category = await Category.create({ name: "Textbooks" });

  return { productId: product._id.toString(), categoryId: category._id.toString() };
}

describe("Listings Controller Branches", () => {
  it("GET /api/listings/:id invalid id -> 400", async () => {
    const res = await request(app).get("/api/listings/not-an-objectid");
    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
  });

  it("GET /api/listings/:id valid but not found -> 404", async () => {
    const res = await request(app).get("/api/listings/000000000000000000000000");
    expect(res.status).toBe(404);
    expect(res.body.message).toBeTruthy();
  });

  it("GET /api/listings/:id found -> 200", async () => {
    const { token } = await reg("owner_get@umass.edu");
    const { productId, categoryId } = await seedProductCategory();

    const created = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId,
        categoryId,
        title: "GetById Listing",
        pickUpLocation: "UMass Library",
        description: "test",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect([200, 201]).toContain(created.status);

    const id = created.body._id ?? created.body.id;
    expect(id).toBeTruthy();

    const res = await request(app).get(`/api/listings/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("GetById Listing");
  });

  it("PATCH /api/listings/:id invalid id -> 400", async () => {
    const { token } = await reg("patch_invalid@umass.edu");

    const res = await request(app)
      .patch("/api/listings/not-an-objectid")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New Title" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
  });

  it("PATCH /api/listings/:id no token -> 401", async () => {
    const res = await request(app)
      .patch("/api/listings/000000000000000000000000")
      .send({ title: "New Title" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBeTruthy();
  });

  it("PATCH /api/listings/:id token but not owner -> 403", async () => {
    const owner = await reg("owner_patch@umass.edu");
    const other = await reg("other_patch@umass.edu");
    const { productId, categoryId } = await seedProductCategory();

    const created = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        productId,
        categoryId,
        title: "Owner Listing",
        pickUpLocation: "UMass Library",
        description: "test",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect([200, 201]).toContain(created.status);
    const id = created.body._id ?? created.body.id;

    const res = await request(app)
      .patch(`/api/listings/${id}`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ title: "Hacked Title" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBeTruthy();
  });

  it("PATCH /api/listings/:id owner -> 200", async () => {
    const owner = await reg("owner_patch_ok@umass.edu");
    const { productId, categoryId } = await seedProductCategory();

    const created = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        productId,
        categoryId,
        title: "Patch Me",
        pickUpLocation: "UMass Library",
        description: "test",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect([200, 201]).toContain(created.status);
    const id = created.body._id ?? created.body.id;

    const res = await request(app)
      .patch(`/api/listings/${id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "Patched Title" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Patched Title");
  });

  it("DELETE /api/listings/:id invalid id -> 400", async () => {
    const { token } = await reg("del_invalid@umass.edu");

    const res = await request(app)
      .delete("/api/listings/not-an-objectid")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
  });

  it("DELETE /api/listings/:id token but not owner -> 403", async () => {
    const owner = await reg("owner_del@umass.edu");
    const other = await reg("other_del@umass.edu");
    const { productId, categoryId } = await seedProductCategory();

    const created = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        productId,
        categoryId,
        title: "Delete Owner Listing",
        pickUpLocation: "UMass Library",
        description: "test",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect([200, 201]).toContain(created.status);
    const id = created.body._id ?? created.body.id;

    const res = await request(app)
      .delete(`/api/listings/${id}`)
      .set("Authorization", `Bearer ${other.token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBeTruthy();
  });

  it("DELETE /api/listings/:id owner -> 204", async () => {
    const owner = await reg("owner_del_ok@umass.edu");
    const { productId, categoryId } = await seedProductCategory();

    const created = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        productId,
        categoryId,
        title: "Delete Me",
        pickUpLocation: "UMass Library",
        description: "test",
        quantity: 1,
        condition: "good",
        isNegotiable: true,
        status: "active",
      });

    expect([200, 201]).toContain(created.status);
    const id = created.body._id ?? created.body.id;

    const res = await request(app)
      .delete(`/api/listings/${id}`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(204);

    // extra: confirm 404 after delete (hits GET not-found branch again)
    const res2 = await request(app).get(`/api/listings/${id}`);
    expect(res2.status).toBe(404);
  });
});