import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import {
  resetAnagraficheStoreForTests,
  seedClienteForTests,
} from "../services/anagrafiche-service.js";
import { resetPortalAccountsForTests } from "../services/auth-service.js";
import { resetFattureStoreForTests } from "../services/fatture-service.js";
import { resetRateLimiter } from "../services/login-rate-limit.js";
import { resetNotificheStoreForTests } from "../services/notifiche-service.js";
import { resetPreventiviStoreForTests, setPreventivoStatoForTests } from "../services/preventivi-service.js";
import { resetRiparazioniStoreForTests } from "../services/riparazioni-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign({ ...payload, tokenType: "access" as const }, "test-jwt-secret", {
    expiresIn: "15m",
  });
}

function authHeader(role: Role, userId = 9800): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

interface PortalSessionInput {
  clienteId?: number;
  email?: string;
  password?: string;
}

function buildRiparazionePayload(index: number, clienteId: number): Record<string, unknown> {
  return {
    clienteId,
    tipoDispositivo: "SMARTPHONE",
    marcaDispositivo: `Brand-${clienteId}-${index}`,
    modelloDispositivo: `Model-${clienteId}-${index}`,
    serialeDispositivo: `SER-${clienteId}-${index}`,
    descrizioneProblema: `Guasto numero ${index}`,
    accessoriConsegnati: "Caricatore",
    priorita: "NORMALE",
  };
}

function buildPreventivoPayload(riparazioneId: number): Record<string, unknown> {
  return {
    riparazioneId,
    voci: [
      {
        tipo: "MANODOPERA",
        descrizione: "Diagnosi",
        quantita: 1,
        prezzoUnitario: 100,
      },
      {
        tipo: "RICAMBIO",
        descrizione: "Ricambio",
        articoloId: 5,
        quantita: 1,
        prezzoUnitario: 120,
      },
    ],
  };
}

async function prepareActivatedPortalSession(input?: PortalSessionInput): Promise<string> {
  const clienteId = input?.clienteId ?? 5;
  const email = input?.email ?? `cliente${clienteId}@test.it`;
  const loginPin = input?.password ?? "Password123!";

  const createResponse = await request(app)
    .post(`/api/clienti/${clienteId}/portal-account`)
    .set("Authorization", authHeader("COMMERCIALE", 9810 + clienteId))
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
    .set("Authorization", authHeader("TECNICO", 9820 + index + clienteId))
    .send(buildRiparazionePayload(index, clienteId));

  expect(response.status).toBe(201);
  expect(typeof response.body?.id).toBe("number");
  return response.body.id as number;
}

async function createPreventivo(riparazioneId: number, userId: number): Promise<number> {
  const response = await request(app)
    .post("/api/preventivi")
    .set("Authorization", authHeader("TECNICO", userId))
    .send(buildPreventivoPayload(riparazioneId));

  expect(response.status).toBe(201);
  expect(typeof response.body?.id).toBe("number");
  return response.body.id as number;
}

async function createApprovedPreventivo(riparazioneId: number, userId: number): Promise<number> {
  const preventivoId = await createPreventivo(riparazioneId, userId);
  setPreventivoStatoForTests(preventivoId, "INVIATO");

  const approveResponse = await request(app)
    .patch(`/api/preventivi/${preventivoId}/risposta`)
    .set("Authorization", authHeader("COMMERCIALE", userId + 200))
    .send({ approvato: true });

  expect(approveResponse.status).toBe(200);
  expect(approveResponse.body?.data?.stato).toBe("APPROVATO");
  return preventivoId;
}

async function createFatturaForRiparazione(riparazioneId: number, userId: number): Promise<number> {
  const response = await request(app)
    .post("/api/fatture")
    .set("Authorization", authHeader("COMMERCIALE", userId))
    .send({ riparazioneId });

  expect(response.status).toBe(201);
  expect(typeof response.body?.data?.id).toBe("number");
  return response.body.data.id as number;
}

async function seedFattureUntil(targetId: number): Promise<number> {
  let currentFatturaId = 0;

  for (let riparazioneId = 1; riparazioneId <= targetId; riparazioneId += 1) {
    const createdRiparazioneId = await createRiparazione(riparazioneId, 5);
    await createApprovedPreventivo(createdRiparazioneId, 9830 + riparazioneId);
    currentFatturaId = await createFatturaForRiparazione(createdRiparazioneId, 9840 + riparazioneId);
  }

  return currentFatturaId;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-13T09:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  resetPreventiviStoreForTests();
  resetFattureStoreForTests();
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

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Given fattura id=8 belongs to authenticated customer When I GET /api/portal/documenti/fattura/8/pdf Then I receive application/pdf with correct filename", () => {
  it("Tests AC-1: Given fattura id=8 belongs to authenticated customer When I GET /api/portal/documenti/fattura/8/pdf Then I receive 200 with pdf headers", async () => {
    const lastFatturaId = await seedFattureUntil(8);
    expect(lastFatturaId).toBe(8);

    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    const response = await request(app)
      .get("/api/portal/documenti/fattura/8/pdf")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain("filename=");
    expect(response.headers["content-disposition"]).toContain(".pdf");
  });

  it("Tests AC-1: Given fattura id=8 belongs to authenticated customer When I GET /api/portal/documenti/fattura/8/pdf Then filename matches normalized invoice pattern", async () => {
    await seedFattureUntil(8);
    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    const response = await request(app)
      .get("/api/portal/documenti/fattura/8/pdf")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toMatch(/filename=.*2026-0008-8\.pdf/);
    expect(Number(response.headers["content-length"] ?? 0)).toBeGreaterThan(0);
  });
});

describe("AC-2 - Given quote id=5 belongs to authenticated customer When I GET /api/portal/documenti/preventivo/5/pdf Then I receive application/pdf with correct filename", () => {
  it("Tests AC-2: Given quote id=5 belongs to authenticated customer When I GET /api/portal/documenti/preventivo/5/pdf Then I receive 200 with pdf headers", async () => {
    const riparazioneId = await createRiparazione(30, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9860);

    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    const response = await request(app)
      .get(`/api/portal/documenti/preventivo/${preventivoId}/pdf`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain("filename=");
    expect(response.headers["content-disposition"]).toContain(".pdf");
  });

  it("Tests AC-2: Given quote id=5 belongs to authenticated customer When I GET /api/portal/documenti/preventivo/5/pdf Then filename equals preventivo-{id}.pdf", async () => {
    const riparazioneId = await createRiparazione(31, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9861);

    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    const response = await request(app)
      .get(`/api/portal/documenti/preventivo/${preventivoId}/pdf`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toContain(`filename=\"preventivo-${preventivoId}.pdf\"`);
    expect(Number(response.headers["content-length"] ?? 0)).toBeGreaterThan(0);
  });
});

describe("AC-3 - Given requested document id belongs to another customer When I GET /api/portal/documenti/fattura/8/pdf Then I receive 403 FORBIDDEN", () => {
  it("Tests AC-3: Given requested document id belongs to another customer When I GET /api/portal/documenti/fattura/8/pdf Then I receive 403 with FORBIDDEN code", async () => {
    await seedFattureUntil(8);

    const accessToken = await prepareActivatedPortalSession({
      clienteId: 99,
      email: "cliente99@test.it",
    });

    const response = await request(app)
      .get("/api/portal/documenti/fattura/8/pdf")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body?.error?.code).toBe("FORBIDDEN");
    expect(response.body?.error?.message).toBe("FORBIDDEN");
  });

  it("Tests AC-3: Given requested document id belongs to another customer When I GET /api/portal/documenti/fattura/8/pdf Then no PDF content is returned", async () => {
    await seedFattureUntil(8);

    const accessToken = await prepareActivatedPortalSession({
      clienteId: 99,
      email: "cliente99@test.it",
    });

    const response = await request(app)
      .get("/api/portal/documenti/fattura/8/pdf")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.headers["content-type"] ?? "").not.toContain("application/pdf");
    expect(response.body).not.toHaveProperty("data.content");
  });
});

describe("AC-4 - Given unauthenticated request When I GET /api/portal/documenti/preventivo/5/pdf Then I receive 401 Unauthorized", () => {
  it("Tests AC-4: Given unauthenticated request When I GET /api/portal/documenti/preventivo/5/pdf Then I receive 401 with UNAUTHORIZED code", async () => {
    const response = await request(app).get("/api/portal/documenti/preventivo/5/pdf");

    expect(response.status).toBe(401);
    expect(response.body?.error?.code).toBe("UNAUTHORIZED");
    expect(response.body).not.toHaveProperty("data");
  });

  it("Tests AC-4: Given unauthenticated request When I GET /api/portal/documenti/preventivo/5/pdf Then I receive token missing message", async () => {
    const response = await request(app).get("/api/portal/documenti/preventivo/5/pdf");

    expect(response.status).toBe(401);
    expect(response.body?.error?.message).toBe("Token mancante o non valido");
    expect(response.headers["content-type"] ?? "").toContain("application/json");
  });
});

describe("Hardening - Portal document download contracts", () => {
  it("returns 400 VALIDATION_ERROR when document id is not a positive integer", async () => {
    await seedFattureUntil(2);
    const accessToken = await prepareActivatedPortalSession({ clienteId: 5, email: "cliente@test.it" });

    const response = await request(app)
      .get("/api/portal/documenti/fattura/not-a-number/pdf")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 403 FORBIDDEN when preventivo belongs to another customer", async () => {
    const riparazioneId = await createRiparazione(50, 5);
    const preventivoId = await createPreventivo(riparazioneId, 9890);

    const accessToken = await prepareActivatedPortalSession({
      clienteId: 99,
      email: "cliente99@test.it",
    });

    const response = await request(app)
      .get(`/api/portal/documenti/preventivo/${preventivoId}/pdf`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body?.error?.code).toBe("FORBIDDEN");
    expect(response.headers["content-type"] ?? "").not.toContain("application/pdf");
  });
});
