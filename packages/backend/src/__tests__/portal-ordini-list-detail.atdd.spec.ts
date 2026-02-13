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

function authHeader(role: Role, userId = 8801): string {
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
    .set("Authorization", authHeader("COMMERCIALE", 8802))
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

async function createRiparazione(index: number): Promise<number> {
  const response = await request(app)
    .post("/api/riparazioni")
    .set("Authorization", authHeader("COMMERCIALE", 9000 + index))
    .send({
      clienteId: 5,
      tipoDispositivo: "SMARTPHONE",
      marcaDispositivo: `Brand-${index}`,
      modelloDispositivo: `Model-${index}`,
      serialeDispositivo: `SER-${index}`,
      descrizioneProblema: `Guasto numero ${index}`,
      accessoriConsegnati: "Caricatore",
      priorita: "NORMALE",
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

describe("AC-1 - Given customer id=5 has 12 orders When GET /api/portal/ordini?page=1&limit=10 Then 10 items + pagination metadata", () => {
  it("Tests AC-1: Given customer id=5 has 12 orders When GET /api/portal/ordini?page=1&limit=10 Then HTTP 200 and exactly 10 items", async () => {
    for (let i = 1; i <= 12; i += 1) {
      await createRiparazione(i);
    }
    const accessToken = await prepareActivatedPortalSession();

    const response = await request(app)
      .get("/api/portal/ordini?page=1&limit=10")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(10);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(10);
    expect(response.body.meta.total).toBe(12);
    expect(response.body.meta.totalPages).toBe(2);
  });

  it("Tests AC-1: Given same scenario When first page is requested Then response includes deterministic pagination keys", async () => {
    for (let i = 1; i <= 12; i += 1) {
      await createRiparazione(100 + i);
    }
    const accessToken = await prepareActivatedPortalSession();

    const response = await request(app)
      .get("/api/portal/ordini?page=1&limit=10")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("meta");
    expect(typeof response.body.meta.total).toBe("number");
    expect(response.body.meta.total).toBeGreaterThanOrEqual(10);
  });
});

describe("AC-2 - Given orders with states IN_ATTESA and IN_LAVORAZIONE exist When GET /api/portal/ordini?stato=IN_LAVORAZIONE Then only IN_LAVORAZIONE", () => {
  it("Tests AC-2: Given mixed states When filtered by IN_LAVORAZIONE Then every returned item has that state", async () => {
    const ids: number[] = [];
    for (let i = 1; i <= 6; i += 1) {
      ids.push(await createRiparazione(200 + i));
    }
    setRiparazioneStatoForTests(ids[0], "IN_ATTESA_RICAMBI");
    setRiparazioneStatoForTests(ids[1], "IN_LAVORAZIONE");
    setRiparazioneStatoForTests(ids[2], "IN_LAVORAZIONE");
    const accessToken = await prepareActivatedPortalSession();

    const response = await request(app)
      .get("/api/portal/ordini?stato=IN_LAVORAZIONE")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    for (const item of response.body.data as Array<Record<string, unknown>>) {
      expect(item.stato).toBe("IN_LAVORAZIONE");
    }
  });

  it("Tests AC-2: Given IN_ATTESA and IN_LAVORAZIONE exist When stato filter applied Then non matching states are excluded", async () => {
    const ids: number[] = [];
    for (let i = 1; i <= 5; i += 1) {
      ids.push(await createRiparazione(300 + i));
    }
    setRiparazioneStatoForTests(ids[0], "IN_ATTESA_RICAMBI");
    setRiparazioneStatoForTests(ids[1], "IN_LAVORAZIONE");
    const accessToken = await prepareActivatedPortalSession();

    const response = await request(app)
      .get("/api/portal/ordini?stato=IN_LAVORAZIONE")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    const hasWrongState = (response.body.data as Array<{ stato?: string }>).some(
      (item) => item.stato !== "IN_LAVORAZIONE",
    );
    expect(hasWrongState).toBe(false);
  });
});

describe("AC-3 - Given order id=20 belongs to authenticated customer When GET /api/portal/ordini/20 Then detail with stato/importi/timeline/documenti", () => {
  it("Tests AC-3: Given order id=20 belongs to authenticated customer When detail is requested Then HTTP 200 with required fields", async () => {
    for (let i = 1; i <= 20; i += 1) {
      await createRiparazione(400 + i);
    }
    const accessToken = await prepareActivatedPortalSession();

    const response = await request(app)
      .get("/api/portal/ordini/20")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(20);
    expect(typeof response.body.data.stato).toBe("string");
    expect(response.body.data).toHaveProperty("importi");
    expect(response.body.data).toHaveProperty("timeline");
    expect(response.body.data).toHaveProperty("documentiCollegati");
  });

  it("Tests AC-3: Given order id=20 belongs to authenticated customer When detail is requested Then timeline/documenti structures are arrays", async () => {
    for (let i = 1; i <= 20; i += 1) {
      await createRiparazione(500 + i);
    }
    const accessToken = await prepareActivatedPortalSession();

    const response = await request(app)
      .get("/api/portal/ordini/20")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.timeline)).toBe(true);
    expect(Array.isArray(response.body.data.documentiCollegati)).toBe(true);
  });
});

describe("AC-4 - Given order id=20 belongs to another customer When GET /api/portal/ordini/20 Then 403 FORBIDDEN", () => {
  it("Tests AC-4: Given order id=20 belongs to customer 5 When customer 99 requests it Then HTTP 403 with FORBIDDEN", async () => {
    for (let i = 1; i <= 20; i += 1) {
      await createRiparazione(600 + i);
    }
    const accessToken = await prepareActivatedPortalSession({
      clienteId: 99,
      email: "cliente99@test.it",
    });

    const response = await request(app)
      .get("/api/portal/ordini/20")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("Tests AC-4: Given forbidden detail request When customer 99 calls order 20 Then no detail payload is leaked", async () => {
    for (let i = 1; i <= 20; i += 1) {
      await createRiparazione(700 + i);
    }
    const accessToken = await prepareActivatedPortalSession({
      clienteId: 99,
      email: "cliente99@test.it",
    });

    const response = await request(app)
      .get("/api/portal/ordini/20")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body).not.toHaveProperty("data.id");
    expect(response.body).not.toHaveProperty("data.timeline");
  });
});
