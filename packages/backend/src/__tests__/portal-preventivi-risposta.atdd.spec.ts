import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import {
  resetAnagraficheStoreForTests,
  seedClienteForTests,
} from "../services/anagrafiche-service.js";
import { resetPortalAccountsForTests } from "../services/auth-service.js";
import { resetRateLimiter } from "../services/login-rate-limit.js";
import { resetNotificheStoreForTests } from "../services/notifiche-service.js";
import { resetPreventiviStoreForTests, setPreventivoStatoForTests } from "../services/preventivi-service.js";
import { resetRiparazioniStoreForTests } from "../services/riparazioni-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";
import jwt from "jsonwebtoken";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign({ ...payload, tokenType: "access" as const }, "test-jwt-secret", {
    expiresIn: "15m",
  });
}

function authHeader(role: Role, userId = 9901): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

interface PortalSessionInput {
  clienteId?: number;
  email?: string;
  password?: string;
}

async function prepareActivatedPortalSession(input?: PortalSessionInput): Promise<string> {
  const clienteId = input?.clienteId ?? 5;
  const email = input?.email ?? `cliente${clienteId}@test.it`;
  const loginPin = input?.password ?? "Password123!";

  const createResponse = await request(app)
    .post(`/api/clienti/${clienteId}/portal-account`)
    .set("Authorization", authHeader("COMMERCIALE", 9902 + clienteId))
    .send({});
  expect(createResponse.status).toBe(201);

  const activateResponse = await request(app)
    .post("/api/portal/auth/activate")
    .send({ token: `portal-${clienteId}-token-valid`, password: loginPin });
  expect(activateResponse.status).toBe(200);

  const loginResponse = await request(app)
    .post("/api/portal/auth/login")
    .send({ email, password: loginPin });
  expect(loginResponse.status).toBe(200);
  expect(loginResponse.body.accessToken).toEqual(expect.any(String));

  return loginResponse.body.accessToken as string;
}

async function createRiparazione(index: number, clienteId = 5): Promise<number> {
  const response = await request(app)
    .post("/api/riparazioni")
    .set("Authorization", authHeader("COMMERCIALE", 9500 + index))
    .send({
      clienteId,
      tipoDispositivo: "SMARTPHONE",
      marcaDispositivo: `Brand-${index}`,
      modelloDispositivo: `Model-${index}`,
      serialeDispositivo: `SER-${index}`,
      descrizioneProblema: `Guasto numero ${index}`,
      accessoriConsegnati: "Caricatore",
      priorita: "NORMALE",
    });

  expect(response.status).toBe(201);
  expect(typeof response.body?.id).toBe("number");
  return response.body.id as number;
}

async function createPreventivo(riparazioneId: number, authUserId: number): Promise<number> {
  const response = await request(app)
    .post("/api/preventivi")
    .set("Authorization", authHeader("COMMERCIALE", authUserId))
    .send({
      riparazioneId,
      voci: [
        {
          tipo: "MANODOPERA",
          descrizione: "Diagnosi",
          quantita: 1,
          prezzoUnitario: 100,
        },
      ],
    });

  expect(response.status).toBe(201);
  expect(typeof response.body?.id).toBe("number");
  return response.body.id as number;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-13T09:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  resetPreventiviStoreForTests();
  resetNotificheStoreForTests();
  resetPortalAccountsForTests();
  resetRateLimiter();

  seedClienteForTests({
    id: 5,
    nome: "Cliente Test SRL",
    codiceCliente: "CLI-000005",
    email: "cliente@test.it",
  });
  seedClienteForTests({
    id: 99,
    nome: "Cliente 99 SRL",
    codiceCliente: "CLI-000099",
    email: "cliente99@test.it",
  });
});

describe("AC-1 - Given preventivo id=5 belongs to my repair and stato is INVIATO When I POST /api/portal/preventivi/5/risposta with { approvato: true } Then preventivo becomes APPROVATO, riparazione becomes APPROVATA, I receive 200", () => {
  it("Tests AC-1: returns 200 and APPROVATO/APPROVATA payload", async () => {
    const riparazioneId = await createRiparazione(1, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9601);
    setPreventivoStatoForTests(preventivoId, "INVIATO");

    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    const response = await request(app)
      .post(`/api/portal/preventivi/${preventivoId}/risposta`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ approvato: true });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(preventivoId);
    expect(response.body?.data?.stato).toBe("APPROVATO");
    expect(response.body?.data?.riparazioneStato).toBe("APPROVATA");
  });

  it("Tests AC-1: keeps response contract with ISO dataRisposta", async () => {
    const riparazioneId = await createRiparazione(2, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9602);
    setPreventivoStatoForTests(preventivoId, "INVIATO");

    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    const response = await request(app)
      .post(`/api/portal/preventivi/${preventivoId}/risposta`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ approvato: true });

    expect(response.status).toBe(200);
    expect(typeof response.body?.data?.dataRisposta).toBe("string");
    expect(Number.isNaN(Date.parse(response.body?.data?.dataRisposta))).toBe(false);
  });
});

describe("AC-2 - Given preventivo id=5 belongs to my repair and stato is INVIATO When I POST /api/portal/preventivi/5/risposta with { approvato: false } Then preventivo becomes RIFIUTATO, riparazione becomes ANNULLATA, I receive 200", () => {
  it("Tests AC-2: returns 200 and RIFIUTATO/ANNULLATA payload", async () => {
    const riparazioneId = await createRiparazione(3, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9603);
    setPreventivoStatoForTests(preventivoId, "INVIATO");

    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    const response = await request(app)
      .post(`/api/portal/preventivi/${preventivoId}/risposta`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ approvato: false });

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("RIFIUTATO");
    expect(response.body?.data?.riparazioneStato).toBe("ANNULLATA");
  });

  it("Tests AC-2: keeps preventivo detail aligned after rejection", async () => {
    const riparazioneId = await createRiparazione(4, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9604);
    setPreventivoStatoForTests(preventivoId, "INVIATO");

    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    await request(app)
      .post(`/api/portal/preventivi/${preventivoId}/risposta`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ approvato: false });

    const detail = await request(app)
      .get(`/api/preventivi/${preventivoId}`)
      .set("Authorization", authHeader("COMMERCIALE", 9604));

    expect(detail.status).toBe(200);
    expect(detail.body?.data?.stato).toBe("RIFIUTATO");
  });
});

describe("AC-3 - Given preventivo id=5 already has stato APPROVATO When I POST /api/portal/preventivi/5/risposta Then I receive 400 with error RESPONSE_ALREADY_RECORDED", () => {
  it("Tests AC-3: returns 400 with RESPONSE_ALREADY_RECORDED", async () => {
    const riparazioneId = await createRiparazione(5, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9605);
    setPreventivoStatoForTests(preventivoId, "APPROVATO");

    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    const response = await request(app)
      .post(`/api/portal/preventivi/${preventivoId}/risposta`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ approvato: true });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("RESPONSE_ALREADY_RECORDED");
  });

  it("Tests AC-3: keeps payload without success data on duplicate response", async () => {
    const riparazioneId = await createRiparazione(6, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9606);
    setPreventivoStatoForTests(preventivoId, "APPROVATO");

    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    const response = await request(app)
      .post(`/api/portal/preventivi/${preventivoId}/risposta`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ approvato: true });

    expect(response.status).toBe(400);
    expect(response.body).not.toHaveProperty("data.id");
    expect(response.body?.error?.code).toBe("RESPONSE_ALREADY_RECORDED");
  });
});

describe("AC-4 - Given preventivo id=5 belongs to another customer When I POST /api/portal/preventivi/5/risposta Then I receive 403 FORBIDDEN", () => {
  it("Tests AC-4: returns 403 FORBIDDEN when customer does not own preventivo", async () => {
    const riparazioneId = await createRiparazione(7, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9607);
    setPreventivoStatoForTests(preventivoId, "INVIATO");

    const accessToken = await prepareActivatedPortalSession({ clienteId: 99, email: "cliente99@test.it" });

    const response = await request(app)
      .post(`/api/portal/preventivi/${preventivoId}/risposta`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ approvato: true });

    expect(response.status).toBe(403);
    expect(response.body?.error?.code).toBe("FORBIDDEN");
  });

  it("Tests AC-4: does not expose success payload fields on forbidden response", async () => {
    const riparazioneId = await createRiparazione(8, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9608);
    setPreventivoStatoForTests(preventivoId, "INVIATO");

    const accessToken = await prepareActivatedPortalSession({ clienteId: 99, email: "cliente99@test.it" });

    const response = await request(app)
      .post(`/api/portal/preventivi/${preventivoId}/risposta`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ approvato: false });

    expect(response.status).toBe(403);
    expect(response.body).not.toHaveProperty("data.id");
    expect(response.body?.error?.code).toBe("FORBIDDEN");
  });
});
