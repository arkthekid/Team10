import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";

jest.mock("../../src/services/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

const app = createApp();

const uniqueEmail = () =>
  `block-api+${Date.now()}-${Math.floor(Math.random() * 10000)}@umass.edu`;

async function registerVerifyAndLogin(email = uniqueEmail(), name = "Block User") {
  const registerRes = await request(app).post("/api/auth/register").send({
    name,
    umassEmail: email,
    password: "Test1234!",
  });

  expect(registerRes.status).toBe(201);

  await AppDataSource.query(
    `UPDATE "user" SET "isVerified" = true WHERE "umassEmail" = $1`,
    [email]
  );

  const loginRes = await request(app).post("/api/auth/login").send({
    umassEmail: email,
    password: "Test1234!",
  });

  expect(loginRes.status).toBe(200);

  return {
    email,
    token: loginRes.body.token,
    user: loginRes.body.user,
  };
}

describe("Block API", () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  beforeEach(async () => {
    await AppDataSource.query(`DELETE FROM "message"`);
    await AppDataSource.query(`DELETE FROM "conversation"`);
    await AppDataSource.query(`DELETE FROM "favorite"`);
    await AppDataSource.query(`DELETE FROM "block"`);
    await AppDataSource.query(`DELETE FROM "listing"`);
    await AppDataSource.query(`DELETE FROM "user"`);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it("POST /api/blocks/:id blocks another user", async () => {
    const blocker = await registerVerifyAndLogin(uniqueEmail(), "Blocker");
    const blocked = await registerVerifyAndLogin(uniqueEmail(), "Blocked");

    const res = await request(app)
      .post(`/api/blocks/${blocked.user.id}`)
      .set("Authorization", `Bearer ${blocker.token}`);

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/blocked/i);
    expect(res.body.block).toBeTruthy();
    expect(res.body.block.blockerId).toBe(blocker.user.id);
    expect(res.body.block.blockedId).toBe(blocked.user.id);
  });

  it("POST /api/blocks/:id rejects blocking yourself", async () => {
    const user = await registerVerifyAndLogin(uniqueEmail(), "Self Block");

    const res = await request(app)
      .post(`/api/blocks/${user.user.id}`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot block yourself/i);
  });

  it("POST /api/blocks/:id rejects duplicate block", async () => {
    const blocker = await registerVerifyAndLogin(uniqueEmail(), "Blocker");
    const blocked = await registerVerifyAndLogin(uniqueEmail(), "Blocked");

    const first = await request(app)
      .post(`/api/blocks/${blocked.user.id}`)
      .set("Authorization", `Bearer ${blocker.token}`);

    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/blocks/${blocked.user.id}`)
      .set("Authorization", `Bearer ${blocker.token}`);

    expect(second.status).toBe(409);
    expect(second.body.message).toMatch(/already blocked/i);
  });

  it("POST /api/blocks/:id rejects unknown user", async () => {
    const blocker = await registerVerifyAndLogin(uniqueEmail(), "Blocker");

    const res = await request(app)
      .post("/api/blocks/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${blocker.token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/user not found/i);
  });

  it("POST /api/blocks/:id rejects missing token", async () => {
    const blocked = await registerVerifyAndLogin(uniqueEmail(), "Blocked");

    const res = await request(app).post(`/api/blocks/${blocked.user.id}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token/i);
  });

  it("GET /api/blocks returns current user's blocked users", async () => {
    const blocker = await registerVerifyAndLogin(uniqueEmail(), "Blocker");
    const blocked = await registerVerifyAndLogin(uniqueEmail(), "Blocked");

    await request(app)
      .post(`/api/blocks/${blocked.user.id}`)
      .set("Authorization", `Bearer ${blocker.token}`);

    const res = await request(app)
      .get("/api/blocks")
      .set("Authorization", `Bearer ${blocker.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].user.id).toBe(blocked.user.id);
    expect(res.body[0].user.name).toBe("Blocked");
    expect(res.body[0].blockedAt).toBeTruthy();
  });

  it("GET /api/blocks rejects missing token", async () => {
    const res = await request(app).get("/api/blocks");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing token/i);
  });

  it("DELETE /api/blocks/:id unblocks a user", async () => {
    const blocker = await registerVerifyAndLogin(uniqueEmail(), "Blocker");
    const blocked = await registerVerifyAndLogin(uniqueEmail(), "Blocked");

    await request(app)
      .post(`/api/blocks/${blocked.user.id}`)
      .set("Authorization", `Bearer ${blocker.token}`);

    const removeRes = await request(app)
      .delete(`/api/blocks/${blocked.user.id}`)
      .set("Authorization", `Bearer ${blocker.token}`);

    expect(removeRes.status).toBe(204);

    const listRes = await request(app)
      .get("/api/blocks")
      .set("Authorization", `Bearer ${blocker.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body).toEqual([]);
  });

  it("DELETE /api/blocks/:id rejects non-existent block", async () => {
    const blocker = await registerVerifyAndLogin(uniqueEmail(), "Blocker");

    const res = await request(app)
      .delete("/api/blocks/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${blocker.token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/block not found/i);
  });
});