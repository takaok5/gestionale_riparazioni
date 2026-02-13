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
import { resetRiparazioniStoreForTests } from "../services/riparazioni-service.js";
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
  const loginSecret = input?.password ?? "Password123!";

  const createResponse = await request(app)
    .post(`/api/clienti/${clienteId}/portal-account`)
    .set("Authorization", authHeader("COMMERCIALE", 8802))
    .send({});
  expect(createResponse.status).toBe(201);

  const activateResponse = await request(app)
    .post("/api/portal/auth/activate")
    .send({ token: `portal-${clienteId}-token-valid`, password: loginSecret });
  expect(activateResponse.status).toBe(200);

  const loginResponse = await request(app)
    .post("/api/portal/auth/login")
    .send({ email, password: loginSecret });
  expect(loginResponse.status).toBe(200);
  expect(loginResponse.body.accessToken).toEqual(expect.any(String));

  return loginResponse.body.accessToken as string;
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
});

describe("AC-1 - Dashboard counters for customer", () => {
  it("Tests AC-1: Given customer id=5 has 2 open orders, 1 active repair, and 1 pending quote When GET /api/portal/me with valid token Then 200 with exact stats", async () => {
    const accessToken = await prepareActivatedPortalSession();

    const response = await request(app)
      .get("/api/portal/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.stats).toEqual({
      ordiniAperti: 2,
      riparazioniAttive: 1,
      preventiviInAttesa: 1,
    });
  });

  it("Tests AC-1: Given same customer scenario When GET /api/portal/me Then stats keys are present and numeric", async () => {
    const accessToken = await prepareActivatedPortalSession();

    const response = await request(app)
      .get("/api/portal/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(typeof response.body.stats.ordiniAperti).toBe("number");
    expect(typeof response.body.stats.riparazioniAttive).toBe("number");
    expect(typeof response.body.stats.preventiviInAttesa).toBe("number");
  });
});

describe("AC-2 - Zero counters are numeric and never null", () => {
  it("Tests AC-2: Given customer has no active items When GET /api/portal/me Then returns zero counters", async () => {
    seedClienteForTests({
      id: 99,
      nome: "Cliente Zero Items",
      codiceCliente: "CLI-000099",
      email: "cliente-zero@test.it",
    });
    const accessToken = await prepareActivatedPortalSession({
      clienteId: 99,
      email: "cliente-zero@test.it",
    });

    const response = await request(app)
      .get("/api/portal/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.stats.ordiniAperti).toBe(0);
    expect(response.body.stats.riparazioniAttive).toBe(0);
    expect(response.body.stats.preventiviInAttesa).toBe(0);
  });

  it("Tests AC-2: Given customer has no active items When GET /api/portal/me Then counters are not null", async () => {
    seedClienteForTests({
      id: 99,
      nome: "Cliente Zero Items",
      codiceCliente: "CLI-000099",
      email: "cliente-zero@test.it",
    });
    const accessToken = await prepareActivatedPortalSession({
      clienteId: 99,
      email: "cliente-zero@test.it",
    });

    const response = await request(app)
      .get("/api/portal/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.stats.ordiniAperti).not.toBeNull();
    expect(response.body.stats.riparazioniAttive).not.toBeNull();
    expect(response.body.stats.preventiviInAttesa).not.toBeNull();
  });
});

describe("AC-3 - Recent events are sorted by descending timestamp", () => {
  it("Tests AC-3: Given customer has recent status/invoice events When GET /api/portal/me Then response has eventiRecenti array", async () => {
    const accessToken = await prepareActivatedPortalSession();

    const response = await request(app)
      .get("/api/portal/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.eventiRecenti)).toBe(true);
    expect(response.body.eventiRecenti.length).toBeGreaterThan(0);
  });

  it("Tests AC-3: Given customer has recent events When GET /api/portal/me Then each event has required keys and descending timestamps", async () => {
    const accessToken = await prepareActivatedPortalSession();

    const response = await request(app)
      .get("/api/portal/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    for (const event of response.body.eventiRecenti as Array<Record<string, unknown>>) {
      expect(event).toHaveProperty("tipo");
      expect(event).toHaveProperty("riferimentoId");
      expect(event).toHaveProperty("timestamp");
      expect(event).toHaveProperty("descrizione");
    }
    for (let i = 0; i < response.body.eventiRecenti.length - 1; i += 1) {
      const left = response.body.eventiRecenti[i].timestamp as string;
      const right = response.body.eventiRecenti[i + 1].timestamp as string;
      expect(left >= right).toBe(true);
    }
  });
});

describe("AC-4 - Unauthorized requests", () => {
  it("Tests AC-4: Given unauthenticated request When GET /api/portal/me Then 401 UNAUTHORIZED", async () => {
    const response = await request(app).get("/api/portal/me");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(response.body.error.message).toBe("Token mancante o non valido");
  });

  it("Tests AC-4: Given invalid bearer token When GET /api/portal/me Then 401 and no dashboard payload", async () => {
    const response = await request(app)
      .get("/api/portal/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(response.body).not.toHaveProperty("stats");
    expect(response.body).not.toHaveProperty("eventiRecenti");
  });
});
