import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetRateLimiter } from "../services/login-rate-limit.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign(
    { ...payload, tokenType: "access" as const },
    "test-jwt-secret",
    { expiresIn: "15m" },
  );
}

function tecnicoAuthHeader(): string {
  return `Bearer ${buildAccessToken({ userId: 1, role: "TECNICO" })}`;
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetRateLimiter();
});

describe("AC-1 - Cambio password con currentPassword corretta", () => {
  it("returns 200 on PUT /api/users/me/password with Password1 -> NewPass2", async () => {
    const response = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", tecnicoAuthHeader())
      .send({ currentPassword: "Password1", newPassword: "NewPass2" });

    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
  });

  it("allows login with NewPass2 after successful password change", async () => {
    const changeResponse = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", tecnicoAuthHeader())
      .send({ currentPassword: "Password1", newPassword: "NewPass2" });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ username: "mario.rossi", password: "NewPass2" });

    expect(changeResponse.status).toBe(200);
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.username).toBe("mario.rossi");
  });
});

describe("AC-2 - Current password errata", () => {
  it("returns 400 with exact message Current password is incorrect", async () => {
    const response = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", tecnicoAuthHeader())
      .send({ currentPassword: "WrongPass9", newPassword: "NewPass2" });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Current password is incorrect");
  });

  it("keeps old password valid when change fails", async () => {
    await request(app)
      .put("/api/users/me/password")
      .set("Authorization", tecnicoAuthHeader())
      .send({ currentPassword: "WrongPass9", newPassword: "NewPass2" });

    const loginOldPassword = await request(app)
      .post("/api/auth/login")
      .send({ username: "mario.rossi", password: "Password1" });

    const loginNewPassword = await request(app)
      .post("/api/auth/login")
      .send({ username: "mario.rossi", password: "NewPass2" });

    expect(loginOldPassword.status).toBe(200);
    expect(loginNewPassword.status).toBe(401);
  });
});

describe("AC-3 - Nuova password non valida", () => {
  it("returns 400 VALIDATION_ERROR for newPassword abc", async () => {
    const response = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", tecnicoAuthHeader())
      .send({ currentPassword: "Password1", newPassword: "abc" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation details for password policy", async () => {
    const response = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", tecnicoAuthHeader())
      .send({ currentPassword: "Password1", newPassword: "abc" });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toMatchObject({
      field: "newPassword",
      rule: "password_policy",
      min: 8,
      requiresUppercase: true,
      requiresNumber: true,
    });
  });
});