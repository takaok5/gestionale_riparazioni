import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import {
  resetFattureStoreForTests,
  seedFattureForReportForTests,
} from "../services/fatture-service.js";
import {
  resetPreventiviStoreForTests,
  seedPreventiviForReportForTests,
} from "../services/preventivi-service.js";

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

function buildSeedPreventivi() {
  const janApproved = Array.from({ length: 22 }, (_, idx) => ({
    id: idx + 1,
    riparazioneId: idx + 100,
    stato: "APPROVATO",
    dataRisposta: "2026-01-20",
    totale: idx === 21 ? 1100 : 400,
  }));
  const janRejected = Array.from({ length: 8 }, (_, idx) => ({
    id: idx + 23,
    riparazioneId: idx + 200,
    stato: "RIFIUTATO",
    dataRisposta: "2026-01-21",
    totale: 300,
  }));
  const febApproved = Array.from({ length: 9 }, (_, idx) => ({
    id: idx + 31,
    riparazioneId: idx + 300,
    stato: "APPROVATO",
    dataRisposta: "2026-02-15",
    totale: 250,
  }));
  const febRejected = Array.from({ length: 5 }, (_, idx) => ({
    id: idx + 40,
    riparazioneId: idx + 400,
    stato: "RIFIUTATO",
    dataRisposta: "2026-02-16",
    totale: 250,
  }));
  return [...janApproved, ...janRejected, ...febApproved, ...febRejected];
}

beforeEach(() => {
  resetFattureStoreForTests();
  resetPreventiviStoreForTests();
  seedFattureForReportForTests([
    {
      id: 1,
      riparazioneId: 100,
      dataEmissione: "2026-01-10",
      totale: 10000,
      totalePagato: 8000,
    },
    {
      id: 2,
      riparazioneId: 101,
      dataEmissione: "2026-01-25",
      totale: 5000,
      totalePagato: 4000,
    },
  ]);
  seedPreventiviForReportForTests(buildSeedPreventivi());
});

describe("AC-1 - Report finanziario gennaio", () => {
  it("Tests AC-1: Given fatture=15000.00 and pagamenti=12000.00 in January 2026 When GET /api/report/finanziari Then returns 200 with KPI keys", async () => {
    const response = await request(app)
      .get("/api/report/finanziari?dateFrom=2026-01-01&dateTo=2026-01-31")
      .set("Authorization", authHeader("ADMIN", 6501));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("fatturato");
    expect(response.body).toHaveProperty("incassato");
    expect(response.body).toHaveProperty("margine");
    expect(response.body).toHaveProperty("preventiviEmessi");
    expect(response.body).toHaveProperty("preventiviApprovati");
    expect(response.body).toHaveProperty("tassoApprovazione");
  });

  it("Tests AC-1: Given January 2026 range When report is returned Then exact KPI values match AC-1", async () => {
    const response = await request(app)
      .get("/api/report/finanziari?dateFrom=2026-01-01&dateTo=2026-01-31")
      .set("Authorization", authHeader("ADMIN", 6502));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      fatturato: 15000.0,
      incassato: 12000.0,
      margine: 5500.0,
      preventiviEmessi: 30,
      preventiviApprovati: 22,
      tassoApprovazione: 73.33,
    });
  });
});

describe("AC-2 - Tasso approvazione preventivi", () => {
  it("Tests AC-2: Given period 2026-02-01..2026-02-28 with 14 preventivi and 9 approved When GET /api/report/finanziari Then returns 200", async () => {
    const response = await request(app)
      .get("/api/report/finanziari?dateFrom=2026-02-01&dateTo=2026-02-28")
      .set("Authorization", authHeader("ADMIN", 6503));

    expect(response.status).toBe(200);
    expect(response.body.preventiviEmessi).toBe(14);
    expect(response.body.preventiviApprovati).toBe(9);
    expect(response.body.fatturato).toBe(0);
    expect(response.body.incassato).toBe(0);
  });

  it("Tests AC-2: Given approved=9 and total=14 When report is returned Then tassoApprovazione is 64.29 with two decimals", async () => {
    const response = await request(app)
      .get("/api/report/finanziari?dateFrom=2026-02-01&dateTo=2026-02-28")
      .set("Authorization", authHeader("ADMIN", 6504));

    expect(response.status).toBe(200);
    expect(response.body.tassoApprovazione).toBe(64.29);
    expect(response.body.tassoApprovazione).toBe(Number(((9 / 14) * 100).toFixed(2)));
  });
});

describe("AC-3 - Endpoint solo Admin", () => {
  it("Tests AC-3: Given COMMERCIALE role When GET /api/report/finanziari Then returns 403 FORBIDDEN", async () => {
    const response = await request(app)
      .get("/api/report/finanziari")
      .set("Authorization", authHeader("COMMERCIALE", 6505));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: "FORBIDDEN", message: "Admin only" },
    });
  });

  it("Tests AC-3: Given COMMERCIALE role When forbidden response is returned Then financial KPI fields are not exposed", async () => {
    const response = await request(app)
      .get("/api/report/finanziari")
      .set("Authorization", authHeader("COMMERCIALE", 6506));

    expect(response.status).toBe(403);
    expect(response.body).not.toHaveProperty("fatturato");
    expect(response.body).not.toHaveProperty("incassato");
    expect(response.body).not.toHaveProperty("tassoApprovazione");
  });
});
