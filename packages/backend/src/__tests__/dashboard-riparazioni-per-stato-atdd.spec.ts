import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
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
});

describe("AC-1 - Aggregazione stati completa", () => {
  it("Tests AC-1: Given admin auth When GET /api/dashboard/riparazioni-per-stato Then returns 200 and all expected keys", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato")
      .set("Authorization", authHeader("ADMIN", 9001));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("RICEVUTA");
    expect(response.body).toHaveProperty("IN_DIAGNOSI");
    expect(response.body).toHaveProperty("IN_LAVORAZIONE");
    expect(response.body).toHaveProperty("PREVENTIVO_EMESSO");
    expect(response.body).toHaveProperty("COMPLETATA");
    expect(response.body).toHaveProperty("CONSEGNATA");
    expect(response.body).toHaveProperty("ANNULLATA");
    expect(Object.keys(response.body).sort()).toEqual([
      "ANNULLATA",
      "COMPLETATA",
      "CONSEGNATA",
      "IN_DIAGNOSI",
      "IN_LAVORAZIONE",
      "PREVENTIVO_EMESSO",
      "RICEVUTA",
    ]);
  });

  it("Tests AC-1: Given dashboard payload When reading values Then each expected key is integer >= 0", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato")
      .set("Authorization", authHeader("ADMIN", 9002));

    const keys = [
      "RICEVUTA",
      "IN_DIAGNOSI",
      "IN_LAVORAZIONE",
      "PREVENTIVO_EMESSO",
      "COMPLETATA",
      "CONSEGNATA",
      "ANNULLATA",
    ];

    expect(response.status).toBe(200);
    for (const key of keys) {
      expect(Number.isInteger(response.body[key])).toBe(true);
      expect(response.body[key]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("AC-2 - Periodo today", () => {
  it("Tests AC-2: Given admin auth When GET /api/dashboard/riparazioni-per-stato?periodo=today Then returns 200", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato?periodo=today")
      .set("Authorization", authHeader("ADMIN", 9101));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("RICEVUTA");
  });

  it("Tests AC-2: Given periodo=today When response arrives Then all counters are numeric", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato?periodo=today")
      .set("Authorization", authHeader("ADMIN", 9102));

    expect(response.status).toBe(200);
    expect(typeof response.body.RICEVUTA).toBe("number");
    expect(typeof response.body.IN_DIAGNOSI).toBe("number");
  });

  it("Tests AC-2: Given unsupported periodo value When GET ?periodo=year Then returns 400 VALIDATION_ERROR", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato?periodo=year")
      .set("Authorization", authHeader("ADMIN", 9103));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(String(response.body.error.message)).toContain("today|week|month");
  });
});

describe("AC-3 - Periodo week", () => {
  it("Tests AC-3: Given admin auth When GET /api/dashboard/riparazioni-per-stato?periodo=week Then returns 200", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato?periodo=week")
      .set("Authorization", authHeader("ADMIN", 9201));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("IN_LAVORAZIONE");
  });

  it("Tests AC-3: Given periodo=week When response arrives Then payload includes all key families", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato?periodo=week")
      .set("Authorization", authHeader("ADMIN", 9202));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("PREVENTIVO_EMESSO");
    expect(response.body).toHaveProperty("ANNULLATA");
  });
});

describe("AC-4 - Periodo month", () => {
  it("Tests AC-4: Given admin auth When GET /api/dashboard/riparazioni-per-stato?periodo=month Then returns 200", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato?periodo=month")
      .set("Authorization", authHeader("ADMIN", 9301));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("COMPLETATA");
  });

  it("Tests AC-4: Given periodo=month When response arrives Then counters are >= 0", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato?periodo=month")
      .set("Authorization", authHeader("ADMIN", 9302));

    expect(response.status).toBe(200);
    expect(response.body.RICEVUTA).toBeGreaterThanOrEqual(0);
    expect(response.body.CONSEGNATA).toBeGreaterThanOrEqual(0);
  });
});

describe("AC-5 - Access control", () => {
  it("Tests AC-5: Given TECNICO role When GET /api/dashboard/riparazioni-per-stato Then returns 403 FORBIDDEN", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato")
      .set("Authorization", authHeader("TECNICO", 9401));

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("Tests AC-5: Given COMMERCIALE role When GET /api/dashboard/riparazioni-per-stato Then returns 403 FORBIDDEN", async () => {
    const response = await request(app)
      .get("/api/dashboard/riparazioni-per-stato")
      .set("Authorization", authHeader("COMMERCIALE", 9402));

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});
