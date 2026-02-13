import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import {
  resetAnagraficheStoreForTests,
  seedClienteForTests,
} from "../services/anagrafiche-service.js";
import { resetPortalAccountsForTests } from "../services/auth-service.js";
import { resetRateLimiter } from "../services/login-rate-limit.js";
import { resetNotificheStoreForTests } from "../services/notifiche-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign({ ...payload, tokenType: "access" as const }, "test-jwt-secret", {
    expiresIn: "15m",
  });
}

function authHeader(role: Role, userId = 8801): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

async function prepareActivatedPortalAccount(pwd = "Password123!"): Promise<void> {
  const createResponse = await request(app)
    .post("/api/clienti/5/portal-account")
    .set("Authorization", authHeader("COMMERCIALE", 8802))
    .send({});
  expect(createResponse.status).toBe(201);

  const activateResponse = await request(app)
    .post("/api/portal/auth/activate")
    .send({ token: "portal-5-token-valid", password: pwd });
  expect(activateResponse.status).toBe(200);
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetPortalAccountsForTests();
  resetNotificheStoreForTests();
  resetRateLimiter();
  seedClienteForTests({
    id: 5,
    nome: "Cliente Test SRL",
    codiceCliente: "CLI-000005",
    email: "cliente@test.it",
  });
});

// Tests AC-1:
// Given portal account email cliente@test.it is ATTIVO with password Password123!
// When POST /api/portal/auth/login with valid credentials
// Then 200 with accessToken, refreshToken and profileSummary
describe("AC-1 - Login portale con credenziali valide", () => {
  it("returns 200 with accessToken and refreshToken", async () => {
    await prepareActivatedPortalAccount("Password123!");

    const response = await request(app)
      .post("/api/portal/auth/login")
      .send({ email: "cliente@test.it", password: "Password123!" });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
  });

  it("returns customer profileSummary with expected identifiers", async () => {
    await prepareActivatedPortalAccount("Password123!");

    const response = await request(app)
      .post("/api/portal/auth/login")
      .send({ email: "cliente@test.it", password: "Password123!" });

    expect(response.status).toBe(200);
    expect(response.body.profileSummary).toMatchObject({
      clienteId: 5,
      codiceCliente: "CLI-000005",
      ragioneSociale: "Cliente Test SRL",
    });
  });
});

// Tests AC-2:
// Given existing portal account and invalid password
// When POST /api/portal/auth/login with invalid credentials
// Then 401 INVALID_CREDENTIALS and no tokens
describe("AC-2 - Login portale con password non valida", () => {
  it("returns 401 with error code INVALID_CREDENTIALS", async () => {
    await prepareActivatedPortalAccount("Password123!");

    const response = await request(app)
      .post("/api/portal/auth/login")
      .send({ email: "cliente@test.it", password: "PasswordErrata1!" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("does not return accessToken and refreshToken", async () => {
    await prepareActivatedPortalAccount("Password123!");

    const response = await request(app)
      .post("/api/portal/auth/login")
      .send({ email: "cliente@test.it", password: "PasswordErrata1!" });

    expect(response.status).toBe(401);
    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.refreshToken).toBeUndefined();
  });
});

// Tests AC-3:
// Given 10 failed attempts in 15 minutes from same IP/account
// When another login attempt is made
// Then 423 ACCOUNT_TEMPORARILY_LOCKED with Retry-After and no tokens
describe("AC-3 - Lock temporaneo account portale", () => {
  it("returns 423 ACCOUNT_TEMPORARILY_LOCKED on attempt after threshold", async () => {
    await prepareActivatedPortalAccount("Password123!");

    for (let i = 0; i < 10; i += 1) {
      await request(app)
        .post("/api/portal/auth/login")
        .set("X-Forwarded-For", "203.0.113.10")
        .send({ email: "cliente@test.it", password: "PasswordErrata1!" });
    }

    const response = await request(app)
      .post("/api/portal/auth/login")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({ email: "cliente@test.it", password: "PasswordErrata1!" });

    expect(response.status).toBe(423);
    expect(response.body.error.code).toBe("ACCOUNT_TEMPORARILY_LOCKED");
  });

  it("returns Retry-After header and no tokens while account is locked", async () => {
    await prepareActivatedPortalAccount("Password123!");

    for (let i = 0; i < 10; i += 1) {
      await request(app)
        .post("/api/portal/auth/login")
        .set("X-Forwarded-For", "203.0.113.11")
        .send({ email: "cliente@test.it", password: "PasswordErrata1!" });
    }

    const response = await request(app)
      .post("/api/portal/auth/login")
      .set("X-Forwarded-For", "203.0.113.11")
      .send({ email: "cliente@test.it", password: "PasswordErrata1!" });

    expect(response.status).toBe(423);
    expect(response.headers["retry-after"]).toEqual(expect.any(String));
    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.refreshToken).toBeUndefined();
  });
});

// Tests AC-4:
// Given valid portal refresh token
// When POST /api/portal/auth/refresh
// Then returns new tokens and invalidates previous refresh token
describe("AC-4 - Refresh token portale", () => {
  it("returns 200 with new accessToken and refreshToken", async () => {
    await prepareActivatedPortalAccount("Password123!");

    const loginResponse = await request(app)
      .post("/api/portal/auth/login")
      .send({ email: "cliente@test.it", password: "Password123!" });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.refreshToken).toEqual(expect.any(String));

    const response = await request(app)
      .post("/api/portal/auth/refresh")
      .send({ refreshToken: loginResponse.body.refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
  });

  it("invalidates old refresh token after successful rotation", async () => {
    await prepareActivatedPortalAccount("Password123!");

    const loginResponse = await request(app)
      .post("/api/portal/auth/login")
      .send({ email: "cliente@test.it", password: "Password123!" });
    const oldRefreshToken = loginResponse.body.refreshToken as string;

    const refreshResponse = await request(app)
      .post("/api/portal/auth/refresh")
      .send({ refreshToken: oldRefreshToken });
    expect(refreshResponse.status).toBe(200);

    const reuseResponse = await request(app)
      .post("/api/portal/auth/refresh")
      .send({ refreshToken: oldRefreshToken });

    expect(reuseResponse.status).toBe(401);
    expect(reuseResponse.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("rejects refresh tokens issued by backoffice auth domain", async () => {
    const backofficeLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: "mario.rossi", password: "Password1" });
    expect(backofficeLogin.status).toBe(200);

    const response = await request(app)
      .post("/api/portal/auth/refresh")
      .send({ refreshToken: backofficeLogin.body.refreshToken });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });
});

// Tests AC-5:
// Given authenticated portal session and active refresh token
// When POST /api/portal/auth/logout with Authorization header and refreshToken in body
// Then refresh token revoked, 200 data.revoked=true, and refresh afterwards returns 401
describe("AC-5 - Logout portale con revoca refresh token", () => {
  it("returns 200 with data.revoked=true", async () => {
    await prepareActivatedPortalAccount("Password123!");

    const loginResponse = await request(app)
      .post("/api/portal/auth/login")
      .send({ email: "cliente@test.it", password: "Password123!" });

    const response = await request(app)
      .post("/api/portal/auth/logout")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken as string}`)
      .send({ refreshToken: loginResponse.body.refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.data.revoked).toBe(true);
    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.refreshToken).toBeUndefined();
  });

  it("returns 401 on refresh with revoked token after logout", async () => {
    await prepareActivatedPortalAccount("Password123!");

    const loginResponse = await request(app)
      .post("/api/portal/auth/login")
      .send({ email: "cliente@test.it", password: "Password123!" });

    await request(app)
      .post("/api/portal/auth/logout")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken as string}`)
      .send({ refreshToken: loginResponse.body.refreshToken });

    const refreshResponse = await request(app)
      .post("/api/portal/auth/refresh")
      .send({ refreshToken: loginResponse.body.refreshToken });

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("returns 401 when logout access token header is invalid", async () => {
    await prepareActivatedPortalAccount("Password123!");

    const loginResponse = await request(app)
      .post("/api/portal/auth/login")
      .send({ email: "cliente@test.it", password: "Password123!" });

    const response = await request(app)
      .post("/api/portal/auth/logout")
      .set("Authorization", "Bearer invalid-token")
      .send({ refreshToken: loginResponse.body.refreshToken });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });
});
