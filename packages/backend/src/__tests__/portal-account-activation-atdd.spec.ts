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

function authHeader(role: Role, userId = 8401): string {
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

describe("AC-4 - Attivazione account portale cliente", () => {
  it("Tests AC-4: Given token valido non scaduto When POST /api/portal/auth/activate Then 200 con data.clienteId=5 e stato ATTIVO", async () => {
    await request(app)
      .post("/api/clienti/5/portal-account")
      .set("Authorization", authHeader("COMMERCIALE", 8402))
      .send({});

    const response = await request(app)
      .post("/api/portal/auth/activate")
      .send({ token: "portal-5-token-valid", password: "NuovaPassword1!" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.clienteId).toBe(5);
    expect(response.body?.data?.stato).toBe("ATTIVO");
  });

  it("Tests AC-4: Given attivazione riuscita When POST /api/portal/auth/login con nuove credenziali Then 200 con accessToken e refreshToken", async () => {
    await request(app)
      .post("/api/clienti/5/portal-account")
      .set("Authorization", authHeader("COMMERCIALE", 8403))
      .send({});

    const activateResponse = await request(app)
      .post("/api/portal/auth/activate")
      .send({ token: "portal-5-token-valid", password: "NuovaPassword1!" });
    expect(activateResponse.status).toBe(200);

    const loginResponse = await request(app)
      .post("/api/portal/auth/login")
      .send({ email: "cliente@test.it", password: "NuovaPassword1!" });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body?.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body?.refreshToken).toEqual(expect.any(String));
  });
});
