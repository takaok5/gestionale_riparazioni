import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import { resetFattureStoreForTests } from "../services/fatture-service.js";
import { resetPreventiviStoreForTests } from "../services/preventivi-service.js";
import { resetRiparazioniStoreForTests } from "../services/riparazioni-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign(
    { ...payload, tokenType: "access" as const },
    "test-jwt-secret",
    { expiresIn: "15m" },
  );
}

function authHeader(role: Role, userId: number): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  resetPreventiviStoreForTests();
  resetFattureStoreForTests();
});

describe("AC-1 - Admin dashboard operativa", () => {
  it("Tests AC-1: Given ADMIN auth When GET /api/dashboard Then 200 and admin keys are present", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", authHeader("ADMIN", 7001));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("riparazioniPerStato");
    expect(response.body).toHaveProperty("caricoTecnici");
    expect(response.body).toHaveProperty("alertMagazzino");
    expect(response.body).toHaveProperty("ultimiPagamenti");
  });

  it("Tests AC-1: Given ADMIN auth When GET /api/dashboard Then admin payload shapes are specific", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", authHeader("ADMIN", 7002));

    expect(response.status).toBe(200);
    expect(typeof response.body.riparazioniPerStato.RICEVUTA).toBe("number");
    expect(Array.isArray(response.body.caricoTecnici)).toBe(true);
    expect(Number.isInteger(response.body.alertMagazzino)).toBe(true);
    expect(Array.isArray(response.body.ultimiPagamenti)).toBe(true);
  });
});

describe("AC-2 - Tecnico dashboard scope", () => {
  it("Tests AC-2: Given TECNICO id=7 When GET /api/dashboard Then technician keys are present", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("mieRiparazioni");
    expect(response.body).toHaveProperty("nextRiparazioni");
  });

  it("Tests AC-2: Given TECNICO id=7 When GET /api/dashboard Then admin-only keys are absent", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty("caricoTecnici");
    expect(response.body).not.toHaveProperty("alertMagazzino");
    expect(Array.isArray(response.body.nextRiparazioni)).toBe(true);
  });
});

describe("AC-3 - Commerciale dashboard KPI", () => {
  it("Tests AC-3: Given COMMERCIALE auth When GET /api/dashboard Then KPI keys are present", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", authHeader("COMMERCIALE", 8001));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("clientiAttivi");
    expect(response.body).toHaveProperty("preventiviPendenti");
    expect(response.body).toHaveProperty("fattureNonPagate");
    expect(response.body).toHaveProperty("fatturato30gg");
  });

  it("Tests AC-3: Given COMMERCIALE auth When GET /api/dashboard Then KPI values are numeric and admin keys absent", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", authHeader("COMMERCIALE", 8002));

    expect(response.status).toBe(200);
    expect(response.body.clientiAttivi).toBeGreaterThanOrEqual(0);
    expect(response.body.preventiviPendenti).toBeGreaterThanOrEqual(0);
    expect(response.body.fattureNonPagate).toBeGreaterThanOrEqual(0);
    expect(response.body.fatturato30gg).toBeGreaterThanOrEqual(0);
    expect(response.body).not.toHaveProperty("caricoTecnici");
    expect(response.body).not.toHaveProperty("alertMagazzino");
  });
});

describe("AC-4 - Unauthorized dashboard", () => {
  it("Tests AC-4: Given no Authorization header When GET /api/dashboard Then 401 with Token mancante", async () => {
    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Token mancante" });
  });

  it("Tests AC-4: Given no Authorization header When GET /api/dashboard Then no dashboard keys are returned", async () => {
    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(401);
    expect(response.body).not.toHaveProperty("riparazioniPerStato");
    expect(response.body).not.toHaveProperty("caricoTecnici");
    expect(response.body).not.toHaveProperty("alertMagazzino");
    expect(response.body).not.toHaveProperty("ultimiPagamenti");
  });
});