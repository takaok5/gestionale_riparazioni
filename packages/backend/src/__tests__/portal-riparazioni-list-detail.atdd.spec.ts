import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import {
  resetAnagraficheStoreForTests,
  seedClienteForTests,
} from "../services/anagrafiche-service.js";
import { resetPortalAccountsForTests } from "../services/auth-service.js";
import { resetRateLimiter } from "../services/login-rate-limit.js";
import { resetNotificheStoreForTests } from "../services/notifiche-service.js";
import { resetPreventiviStoreForTests } from "../services/preventivi-service.js";
import {
  resetRiparazioniStoreForTests,
  setRiparazioneStatoForTests,
} from "../services/riparazioni-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

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
  const email = input?.email ?? "cliente@test.it";
  const loginPin = input?.password ?? "Password123!";

  const createResponse = await request(app)
    .post(`/api/clienti/${clienteId}/portal-account`)
    .set("Authorization", authHeader("COMMERCIALE", 9902))
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

async function createRiparazione(
  index: number,
  overrides?: Partial<Record<string, unknown>>,
): Promise<number> {
  const response = await request(app)
    .post("/api/riparazioni")
    .set("Authorization", authHeader("COMMERCIALE", 9950 + index))
    .send({
      clienteId: 5,
      tipoDispositivo: "SMARTPHONE",
      marcaDispositivo: `Brand-${index}`,
      modelloDispositivo: `Model-${index}`,
      serialeDispositivo: `SER-${index}`,
      descrizioneProblema: `Guasto numero ${index}`,
      accessoriConsegnati: "Caricatore",
      priorita: "NORMALE",
      ...overrides,
    });

  expect(response.status).toBe(201);
  expect(response.body.id).toEqual(expect.any(Number));
  return response.body.id as number;
}

beforeEach(() => {
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
    nome: "Cliente Altro",
    codiceCliente: "CLI-000099",
    email: "cliente99@test.it",
  });
});

describe("AC-1 - Given customer id=5 has 3 repairs When GET /api/portal/riparazioni Then 200 with status + basic device details", () => {
  it("Tests AC-1: Given customer id=5 has exactly 3 repairs When list endpoint is requested Then returns HTTP 200 with 3 rows", async () => {
    await createRiparazione(1);
    await createRiparazione(2);
    await createRiparazione(3);
    const accessToken = await prepareActivatedPortalSession({ clienteId: 5 });

    const response = await request(app)
      .get("/api/portal/riparazioni")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(3);
  });

  it("Tests AC-1: Given list payload is returned When reading row fields Then each row has stato, tipoDispositivo, marcaDispositivo, modelloDispositivo", async () => {
    await createRiparazione(5);
    await createRiparazione(6);
    await createRiparazione(7);
    const accessToken = await prepareActivatedPortalSession({ clienteId: 5 });

    const response = await request(app)
      .get("/api/portal/riparazioni")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    for (const row of response.body.data as Array<Record<string, unknown>>) {
      expect(typeof row.stato).toBe("string");
      expect((row.stato as string).length).toBeGreaterThan(0);
      expect(typeof row.tipoDispositivo).toBe("string");
      expect(typeof row.marcaDispositivo).toBe("string");
      expect(typeof row.modelloDispositivo).toBe("string");
    }
  });
});

describe("AC-2 - Given repairs in IN_DIAGNOSI and COMPLETATA exist When GET /api/portal/riparazioni?stato=IN_DIAGNOSI Then only diagnostics-phase repairs", () => {
  it("Tests AC-2: Given mixed states When stato filter IN_DIAGNOSI is applied Then every row has stato IN_DIAGNOSI", async () => {
    const id1 = await createRiparazione(8);
    const id2 = await createRiparazione(9);
    const id3 = await createRiparazione(10);
    setRiparazioneStatoForTests(id1, "IN_DIAGNOSI");
    setRiparazioneStatoForTests(id2, "COMPLETATA");
    setRiparazioneStatoForTests(id3, "IN_DIAGNOSI");
    const accessToken = await prepareActivatedPortalSession({ clienteId: 5 });

    const response = await request(app)
      .get("/api/portal/riparazioni?stato=IN_DIAGNOSI")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    for (const row of response.body.data as Array<{ stato?: string }>) {
      expect(row.stato).toBe("IN_DIAGNOSI");
    }
  });

  it("Tests AC-2: Given filtered list response When checking meta Then filtered total is coherent and COMPLETATA is excluded", async () => {
    const id1 = await createRiparazione(11);
    const id2 = await createRiparazione(12);
    setRiparazioneStatoForTests(id1, "IN_DIAGNOSI");
    setRiparazioneStatoForTests(id2, "COMPLETATA");
    const accessToken = await prepareActivatedPortalSession({ clienteId: 5 });

    const response = await request(app)
      .get("/api/portal/riparazioni?stato=IN_DIAGNOSI")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.meta.total).toBeGreaterThanOrEqual(response.body.data.length);
    const hasCompleted = (response.body.data as Array<{ stato?: string }>).some(
      (row) => row.stato === "COMPLETATA",
    );
    expect(hasCompleted).toBe(false);
  });
});

describe("AC-3 - Given repair id=10 belongs to authenticated customer When GET /api/portal/riparazioni/10 Then full detail with timeline and linked document ids", () => {
  it("Tests AC-3: Given repair id=10 belongs to customer 5 When detail endpoint is requested Then returns 200 with id=10 and arrays timeline/documentiCollegati", async () => {
    for (let i = 1; i <= 10; i += 1) {
      await createRiparazione(100 + i);
    }
    const accessToken = await prepareActivatedPortalSession({ clienteId: 5 });

    const response = await request(app)
      .get("/api/portal/riparazioni/10")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(10);
    expect(Array.isArray(response.body.data.timeline)).toBe(true);
    expect(Array.isArray(response.body.data.documentiCollegati)).toBe(true);
  });

  it("Tests AC-3: Given detail payload is returned When validating object shape Then timeline and linked documents expose required keys", async () => {
    for (let i = 1; i <= 10; i += 1) {
      await createRiparazione(200 + i);
    }
    const accessToken = await prepareActivatedPortalSession({ clienteId: 5 });

    const response = await request(app)
      .get("/api/portal/riparazioni/10")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    for (const item of response.body.data.timeline as Array<Record<string, unknown>>) {
      expect(typeof item.stato).toBe("string");
      expect(typeof item.dataOra).toBe("string");
    }
    for (const doc of response.body.data.documentiCollegati as Array<Record<string, unknown>>) {
      expect(typeof doc.tipo).toBe("string");
      expect(typeof doc.riferimentoId).toBe("number");
    }
  });
});

describe("AC-4 - Given repair id=10 does not belong to authenticated customer When GET /api/portal/riparazioni/10 Then 403 FORBIDDEN", () => {
  it("Tests AC-4: Given repair id=10 belongs to customer 5 When customer 99 requests detail Then returns HTTP 403 with FORBIDDEN code", async () => {
    for (let i = 1; i <= 10; i += 1) {
      await createRiparazione(300 + i);
    }
    const accessToken = await prepareActivatedPortalSession({
      clienteId: 99,
      email: "cliente99@test.it",
    });

    const response = await request(app)
      .get("/api/portal/riparazioni/10")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("Tests AC-4: Given forbidden detail request When response is returned Then no detail payload is exposed", async () => {
    for (let i = 1; i <= 10; i += 1) {
      await createRiparazione(400 + i);
    }
    const accessToken = await prepareActivatedPortalSession({
      clienteId: 99,
      email: "cliente99@test.it",
    });

    const response = await request(app)
      .get("/api/portal/riparazioni/10")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body).not.toHaveProperty("data.id");
    expect(response.body).not.toHaveProperty("data.timeline");
  });
});

describe("Hardening - Auth and validation", () => {
  it("returns 401 when Authorization header is missing on list endpoint", async () => {
    const response = await request(app).get("/api/portal/riparazioni");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when riparazione id is not a positive integer", async () => {
    const accessToken = await prepareActivatedPortalSession({ clienteId: 5 });
    const response = await request(app)
      .get("/api/portal/riparazioni/not-a-number")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
