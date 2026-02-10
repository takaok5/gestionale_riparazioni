import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../index.js";

function buildRefreshToken(
  payload: { userId: number; role: string; tokenType?: "access" | "refresh" },
  options?: {
    secret?: string;
    expiresIn?: jwt.SignOptions["expiresIn"];
  },
): string {
  const secret = options?.secret ?? "test-jwt-secret";
  const expiresIn: jwt.SignOptions["expiresIn"] =
    options?.expiresIn ?? "7d";
  const tokenPayload = {
    tokenType: "refresh" as const,
    ...payload,
  };

  return jwt.sign(tokenPayload, secret, { expiresIn });
}

describe("AC-1 - Rinnovo con refresh token valido", () => {
  it("returns 200 with new accessToken and refreshToken", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ username: "mario.rossi", password: "Password1" });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.refreshToken).toEqual(expect.any(String));

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginResponse.body.refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
  });

  it("returns user payload with id, username, email and role", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ username: "mario.rossi", password: "Password1" });

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginResponse.body.refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: 1,
      username: "mario.rossi",
      email: "mario.rossi@example.com",
      role: "TECNICO",
    });
  });
});

describe("AC-2 - Refresh token mancante", () => {
  it("returns 401 INVALID_REFRESH_TOKEN when body is empty", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("does not return accessToken and refreshToken when token is missing", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.refreshToken).toBeUndefined();
  });
});

describe("AC-3 - Refresh token non JWT", () => {
  it("returns 401 INVALID_REFRESH_TOKEN for non-JWT token", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "abc" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("never returns auth tokens for malformed refresh token", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "abc" });

    expect(response.status).toBe(401);
    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.refreshToken).toBeUndefined();
  });
});

describe("AC-4 - Refresh token scaduto o firma invalida", () => {
  it("returns 401 INVALID_REFRESH_TOKEN for expired refresh token", async () => {
    const expiredToken = buildRefreshToken(
      { userId: 1, role: "TECNICO" },
      { expiresIn: "-1s" },
    );

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: expiredToken });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("returns 401 INVALID_REFRESH_TOKEN for token signed with wrong secret", async () => {
    const wrongSecretToken = buildRefreshToken(
      { userId: 1, role: "TECNICO" },
      { secret: "wrong-secret" },
    );

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: wrongSecretToken });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("returns 401 INVALID_REFRESH_TOKEN when using an access token on refresh endpoint", async () => {
    const accessToken = buildRefreshToken({
      userId: 1,
      role: "TECNICO",
      tokenType: "access",
    });

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: accessToken });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });
});

describe("AC-5 - Account disabilitato su refresh", () => {
  it("returns 401 ACCOUNT_DISABLED when refresh token belongs to disabled user", async () => {
    const disabledUserToken = buildRefreshToken({ userId: 2, role: "TECNICO" });

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: disabledUserToken });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("ACCOUNT_DISABLED");
  });

  it("does not expose accessToken or refreshToken for disabled user refresh", async () => {
    const disabledUserToken = buildRefreshToken({ userId: 2, role: "TECNICO" });

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: disabledUserToken });

    expect(response.status).toBe(401);
    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.refreshToken).toBeUndefined();
  });
});
