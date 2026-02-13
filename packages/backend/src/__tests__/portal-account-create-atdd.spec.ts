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

function authHeader(role: Role, userId = 8101): string {
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

describe("AC-1 - POST /api/clienti/5/portal-account crea account INVITATO", () => {
  it("Tests AC-1: Given cliente id=5 con email When POST /api/clienti/5/portal-account Then 201 con data.clienteId=5 e stato INVITATO", async () => {
    const response = await request(app)
      .post("/api/clienti/5/portal-account")
      .set("Authorization", authHeader("COMMERCIALE", 8102))
      .send({});

    expect(response.status).toBe(201);
    expect(response.body?.data?.clienteId).toBe(5);
    expect(response.body?.data?.stato).toBe("INVITATO");
  });

  it("Tests AC-1: Given creazione account riuscita When GET /api/notifiche?tipo=PORTAL_ACCOUNT_ATTIVAZIONE Then esiste notifica con riferimentoId=5", async () => {
    const createResponse = await request(app)
      .post("/api/clienti/5/portal-account")
      .set("Authorization", authHeader("COMMERCIALE", 8103))
      .send({});

    expect(createResponse.status).toBe(201);

    const notificheResponse = await request(app)
      .get("/api/notifiche?tipo=PORTAL_ACCOUNT_ATTIVAZIONE")
      .set("Authorization", authHeader("ADMIN", 8104));

    expect(notificheResponse.status).toBe(200);
    const latest = (notificheResponse.body?.data ?? []).at(-1);
    expect(latest?.riferimentoId).toBe(5);
    expect(latest?.tipo).toBe("PORTAL_ACCOUNT_ATTIVAZIONE");
  });
});
