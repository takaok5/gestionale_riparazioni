import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign(
    { ...payload, tokenType: "access" as const },
    "test-jwt-secret",
    { expiresIn: "15m" },
  );
}

function adminAuthHeader(): string {
  return `Bearer ${buildAccessToken({ userId: 1000, role: "ADMIN" })}`;
}

function tecnicoAuthHeader(): string {
  return `Bearer ${buildAccessToken({ userId: 1, role: "TECNICO" })}`;
}

const validPayload = {
  username: "nuovo.utente",
  email: "nuovo@test.it",
  password: "Password1",
  role: "TECNICO",
};

beforeEach(() => {
  resetUsersStoreForTests();
});

describe("AC-1 - Admin crea utente con ruolo specifico", () => {
  it("returns 201 and created user fields for valid ADMIN request", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      username: "nuovo.utente",
      email: "nuovo@test.it",
      role: "TECNICO",
      isActive: true,
    });
  });

  it("does not expose password or passwordHash in create response", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.password).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();
  });
});

describe("AC-2 - Username duplicato", () => {
  it("returns 409 USERNAME_EXISTS when username already exists", async () => {
    const firstResponse = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send(validPayload);

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send(validPayload);

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error.code).toBe("USERNAME_EXISTS");
  });

  it("does not return created user payload on duplicate username", async () => {
    await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send(validPayload);

    const duplicateResponse = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send(validPayload);

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.id).toBeUndefined();
    expect(duplicateResponse.body.username).toBeUndefined();
  });
});

describe("Review fix - Email duplicata", () => {
  it("returns 409 EMAIL_EXISTS when email already exists", async () => {
    const firstResponse = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send(validPayload);

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send({
        username: "nuovo.utente.2",
        email: validPayload.email,
        password: "Password1",
        role: "TECNICO",
      });

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error.code).toBe("EMAIL_EXISTS");
  });
});

describe("AC-3 - Password troppo corta", () => {
  it("returns 400 VALIDATION_ERROR for password shorter than 8", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send({
        username: "utente.password.corta",
        email: "utente.corta@test.it",
        password: "abc",
        role: "TECNICO",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toMatchObject({
      field: "password",
      rule: "min_length",
      min: 8,
    });
  });

  it("does not create user when password validation fails", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send({
        username: "utente.password.corta.2",
        email: "utente.corta.2@test.it",
        password: "abc",
        role: "TECNICO",
      });

    expect(response.status).toBe(400);
    expect(response.body.id).toBeUndefined();
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("Review fix - Email non valida", () => {
  it("returns 400 VALIDATION_ERROR for malformed email", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuthHeader())
      .send({
        username: "utente.email.non.valida",
        email: "utente.non.valido@",
        password: "Password1",
        role: "TECNICO",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toMatchObject({
      field: "email",
      rule: "invalid_format",
    });
  });
});

describe("AC-4 - Tecnico non autorizzato", () => {
  it("returns 403 FORBIDDEN when role is TECNICO", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", tecnicoAuthHeader())
      .send(validPayload);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("does not return created user payload when access is forbidden", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", tecnicoAuthHeader())
      .send(validPayload);

    expect(response.status).toBe(403);
    expect(response.body.id).toBeUndefined();
    expect(response.body.username).toBeUndefined();
  });
});
