import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import {
  resetAnagraficheStoreForTests,
  seedClienteForTests,
} from "../services/anagrafiche-service.js";
import { resetPortalAccountsForTests } from "../services/auth-service.js";
import { resetNotificheStoreForTests } from "../services/notifiche-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign({ ...payload, tokenType: "access" as const }, "test-jwt-secret", {
    expiresIn: "15m",
  });
}

function authHeader(role: Role, userId = 8301): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetPortalAccountsForTests();
  resetNotificheStoreForTests();
  seedClienteForTests({
    id: 5,
    nome: "Cliente Senza Email",
    codiceCliente: "CLI-000005",
    email: null,
  });
});

describe("AC-3 - POST /api/clienti/5/portal-account richiede email cliente", () => {
  it("Tests AC-3: Given cliente id=5 con email=null When POST /api/clienti/5/portal-account Then 400 con error.code CUSTOMER_EMAIL_REQUIRED", async () => {
    const response = await request(app)
      .post("/api/clienti/5/portal-account")
      .set("Authorization", authHeader("COMMERCIALE", 8302))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("CUSTOMER_EMAIL_REQUIRED");
  });

  it('Tests AC-3: Given email mancante When POST /api/clienti/5/portal-account Then error.message e "Customer email is required"', async () => {
    const response = await request(app)
      .post("/api/clienti/5/portal-account")
      .set("Authorization", authHeader("COMMERCIALE", 8303))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe("Customer email is required");
    expect(response.body?.data).toBeUndefined();
  });
});
