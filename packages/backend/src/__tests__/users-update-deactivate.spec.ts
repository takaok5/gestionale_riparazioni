import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import {
  resetUsersStoreForTests,
  setUserIsActiveForTests,
  setUserRoleForTests,
} from "../services/users-service.js";

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

beforeEach(() => {
  resetUsersStoreForTests();
});

describe("AC-1 - Admin modifica ruolo utente", () => {
  it("returns 200 and updates role to COMMERCIALE for user id=2", async () => {
    const response = await request(app)
      .put("/api/users/2")
      .set("Authorization", adminAuthHeader())
      .send({ role: "COMMERCIALE" });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(2);
    expect(response.body.role).toBe("COMMERCIALE");
  });

  it("keeps username/email unchanged when updating role", async () => {
    const response = await request(app)
      .put("/api/users/2")
      .set("Authorization", adminAuthHeader())
      .send({ role: "COMMERCIALE" });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe("mario.disabilitato");
    expect(response.body.email).toBe("mario.disabilitato@example.com");
  });
});

describe("AC-2 - Admin disattiva account", () => {
  it("returns 200 and sets isActive=false for user id=2", async () => {
    setUserIsActiveForTests(2, true);

    const response = await request(app)
      .patch("/api/users/2/deactivate")
      .set("Authorization", adminAuthHeader())
      .send();

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(2);
    expect(response.body.isActive).toBe(false);
  });

  it("returns payload containing id=2 and isActive=false after deactivation", async () => {
    setUserIsActiveForTests(2, true);

    const response = await request(app)
      .patch("/api/users/2/deactivate")
      .set("Authorization", adminAuthHeader())
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 2,
      isActive: false,
    });
  });
});

describe("AC-3 - Blocco disattivazione ultimo admin", () => {
  it("returns 400 LAST_ADMIN_DEACTIVATION_FORBIDDEN when deactivating the only active admin", async () => {
    setUserRoleForTests(1, "ADMIN");
    setUserIsActiveForTests(1, true);
    setUserRoleForTests(2, "TECNICO");
    setUserIsActiveForTests(2, false);

    const response = await request(app)
      .patch("/api/users/1/deactivate")
      .set("Authorization", adminAuthHeader())
      .send();

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("LAST_ADMIN_DEACTIVATION_FORBIDDEN");
    expect(response.body.error.message).toBe("Cannot deactivate the last admin");
  });

  it("returns exact error message for last admin deactivation attempt", async () => {
    setUserRoleForTests(1, "ADMIN");
    setUserIsActiveForTests(1, true);
    setUserRoleForTests(2, "TECNICO");
    setUserIsActiveForTests(2, false);

    const response = await request(app)
      .patch("/api/users/1/deactivate")
      .set("Authorization", adminAuthHeader())
      .send();

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Cannot deactivate the last admin");
    expect(response.body.error.code).toBe("LAST_ADMIN_DEACTIVATION_FORBIDDEN");
  });
});

describe("AC-4 - Tecnico non autorizzato su modifica", () => {
  it("returns 403 FORBIDDEN when TECNICO calls PUT /api/users/2", async () => {
    const response = await request(app)
      .put("/api/users/2")
      .set("Authorization", tecnicoAuthHeader())
      .send({ role: "COMMERCIALE" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(response.body.error.message).toBeDefined();
  });

  it("does not return successful user payload for forbidden TECNICO request", async () => {
    const response = await request(app)
      .put("/api/users/2")
      .set("Authorization", tecnicoAuthHeader())
      .send({ role: "COMMERCIALE" });

    expect(response.status).toBe(403);
    expect(response.body.id).toBeUndefined();
    expect(response.body.role).toBeUndefined();
  });
});

describe("Review fix - Validazione e not found", () => {
  it("returns 400 VALIDATION_ERROR when user id is not a positive integer", async () => {
    const response = await request(app)
      .put("/api/users/abc")
      .set("Authorization", adminAuthHeader())
      .send({ role: "COMMERCIALE" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.field).toBe("userId");
  });

  it("returns 404 USER_NOT_FOUND when deactivating a missing user", async () => {
    const response = await request(app)
      .patch("/api/users/999/deactivate")
      .set("Authorization", adminAuthHeader())
      .send();

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("USER_NOT_FOUND");
    expect(response.body.error.message).toBe("Utente non trovato");
  });
});
