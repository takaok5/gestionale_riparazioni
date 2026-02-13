import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../index.js";

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

describe("AC-1 - Export riparazioni CSV", () => {
  it("Tests AC-1: Given riparazioni exist When GET /api/report/export/riparazioni with date range Then returns 200 and text/csv", async () => {
    const response = await request(app)
      .get("/api/report/export/riparazioni?dateFrom=2026-01-01&dateTo=2026-01-31")
      .set("Authorization", authHeader("ADMIN", 6701));

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
  });

  it("Tests AC-1: Given export endpoint When request succeeds Then csv header and filename match contract", async () => {
    const response = await request(app)
      .get("/api/report/export/riparazioni?dateFrom=2026-01-01&dateTo=2026-01-31")
      .set("Authorization", authHeader("ADMIN", 6702));

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toContain(
      "attachment; filename=\"report-riparazioni-2026-01-01_2026-01-31.csv\"",
    );
    expect(response.text.split("\n")[0]?.trim()).toBe(
      "codiceRiparazione,cliente,tecnico,stato,dataRicezione,dataCompletamento",
    );
  });
});

describe("AC-2 - Export finanziari CSV", () => {
  it("Tests AC-2: Given fatture in date range When GET /api/report/export/finanziari Then returns 200 and text/csv", async () => {
    const response = await request(app)
      .get("/api/report/export/finanziari?dateFrom=2026-01-01&dateTo=2026-01-31")
      .set("Authorization", authHeader("ADMIN", 6703));

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
  });

  it("Tests AC-2: Given export endpoint When request succeeds Then header schema and filename match contract", async () => {
    const response = await request(app)
      .get("/api/report/export/finanziari?dateFrom=2026-01-01&dateTo=2026-01-31")
      .set("Authorization", authHeader("ADMIN", 6704));

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toContain(
      "attachment; filename=\"report-finanziari-2026-01-01_2026-01-31.csv\"",
    );
    expect(response.text.split("\n")[0]?.trim()).toBe(
      "numeroFattura,cliente,stato,totale,dataEmissione,dataPagamento",
    );
  });
});

describe("AC-3 - Export magazzino CSV", () => {
  it("Tests AC-3: Given articoli exist When GET /api/report/export/magazzino Then returns 200 and text/csv", async () => {
    const response = await request(app)
      .get("/api/report/export/magazzino")
      .set("Authorization", authHeader("ADMIN", 6705));

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
  });

  it("Tests AC-3: Given export endpoint When request succeeds Then header schema and filename match contract", async () => {
    const response = await request(app)
      .get("/api/report/export/magazzino")
      .set("Authorization", authHeader("ADMIN", 6706));

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toContain(
      "attachment; filename=\"report-magazzino.csv\"",
    );
    expect(response.text.split("\n")[0]?.trim()).toBe(
      "articoloId,nome,giacenza,sogliaMinima,prezzoAcquisto,valoreGiacenza",
    );
  });
});

describe("AC-4 - Export endpoint admin only", () => {
  it("Tests AC-4: Given TECNICO role When GET /api/report/export/riparazioni Then returns 403 FORBIDDEN", async () => {
    const response = await request(app)
      .get("/api/report/export/riparazioni")
      .set("Authorization", authHeader("TECNICO", 6707));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: "FORBIDDEN", message: "Admin only" },
    });
  });

  it("Tests AC-4: Given COMMERCIALE role When GET /api/report/export/riparazioni Then returns 403 and no csv payload", async () => {
    const response = await request(app)
      .get("/api/report/export/riparazioni")
      .set("Authorization", authHeader("COMMERCIALE", 6708));

    expect(response.status).toBe(403);
    expect(response.headers["content-type"] ?? "").not.toContain("text/csv");
  });
});
