import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetRateLimiter } from "../services/login-rate-limit.js";

beforeEach(() => {
  resetRateLimiter();
});

describe("AC-1 - Login Utente valido", () => {
  it("returns 200 with accessToken and refreshToken when credentials are valid", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "mario.rossi", password: "Password1" });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
  });

  it("returns user payload with id, username, email, role", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "mario.rossi", password: "Password1" });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: expect.anything(),
      username: "mario.rossi",
      email: expect.any(String),
      role: expect.any(String),
    });
  });
});

describe("AC-2 - Username inesistente", () => {
  it("returns 401 for utente.inesistente with Password1", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "utente.inesistente", password: "Password1" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("does not return access tokens on invalid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "utente.inesistente", password: "Password1" });

    expect(response.status).toBe(401);
    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.refreshToken).toBeUndefined();
  });
});

describe("AC-3 - Account disabilitato", () => {
  it("returns 401 ACCOUNT_DISABLED for mario.disabilitato", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "mario.disabilitato", password: "Password1" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("ACCOUNT_DISABLED");
  });

  it("returns no tokens for disabled account", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "mario.disabilitato", password: "Password1" });

    expect(response.status).toBe(401);
    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.refreshToken).toBeUndefined();
  });
});

describe("AC-4 - Rate limit login", () => {
  it("returns 429 on the sixth failed login attempt from same IP", async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", "203.0.113.10")
        .send({ username: "utente.inesistente", password: "Password1" });
    }

    const response = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({ username: "utente.inesistente", password: "Password1" });

    expect(response.status).toBe(429);
    expect(response.headers.retryafter).toEqual(expect.any(String));
  });

  it("returns retryAfter as integer seconds between 1 and 60", async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", "203.0.113.11")
        .send({ username: "utente.inesistente", password: "Password1" });
    }

    const response = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", "203.0.113.11")
      .send({ username: "utente.inesistente", password: "Password1" });

    const retryAfter = Number(response.headers.retryafter);

    expect(response.status).toBe(429);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });
});
