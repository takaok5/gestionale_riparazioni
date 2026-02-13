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

function authHeader(role: Role, userId = 8201): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetPortalAccountsForTests();
  resetNotificheStoreForTests();
  seedClienteForTests({
    id: 5,
    nome: "Cliente Portale",
    codiceCliente: "CLI-000005",
    email: "cliente@test.it",
  });
});

describe("AC-2 - POST /api/clienti/5/portal-account conflitto account esistente", () => {
  it("Tests AC-2: Given account gia ATTIVO When POST /api/clienti/5/portal-account Then 409 con error.code PORTAL_ACCOUNT_ALREADY_EXISTS", async () => {
    const firstResponse = await request(app)
      .post("/api/clienti/5/portal-account")
      .set("Authorization", authHeader("COMMERCIALE", 8202))
      .send({});
    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post("/api/clienti/5/portal-account")
      .set("Authorization", authHeader("COMMERCIALE", 8203))
      .send({});

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body?.error?.code).toBe("PORTAL_ACCOUNT_ALREADY_EXISTS");
  });

  it('Tests AC-2: Given account gia ATTIVO When POST /api/clienti/5/portal-account Then error.message e "Portal account already exists"', async () => {
    await request(app)
      .post("/api/clienti/5/portal-account")
      .set("Authorization", authHeader("COMMERCIALE", 8204))
      .send({});

    const response = await request(app)
      .post("/api/clienti/5/portal-account")
      .set("Authorization", authHeader("COMMERCIALE", 8205))
      .send({});

    expect(response.status).toBe(409);
    expect(response.body?.error?.message).toBe("Portal account already exists");
    expect(response.body?.data).toBeUndefined();
  });
});
