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

describe("AC-1 - Carico tecnici con conteggi attivi", () => {
  it("Tests AC-1: Given tecnico 7=6 and tecnico 8=3 active repairs When GET /api/dashboard/carico-tecnici as ADMIN Then returns 200 with the expected entries", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("ADMIN", 7001));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual(
      expect.arrayContaining([
        {
          tecnicoId: 7,
          username: "mario.rossi",
          nome: "Mario Rossi",
          riparazioniAttive: 6,
        },
        {
          tecnicoId: 8,
          username: "anna.verdi",
          nome: "Anna Verdi",
          riparazioniAttive: 3,
        },
      ]),
    );
  });

  it("Tests AC-1: Given ADMIN auth When reading /api/dashboard/carico-tecnici Then each row has integer riparazioniAttive >= 0", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("ADMIN", 7002));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    for (const row of response.body as Array<Record<string, unknown>>) {
      expect(Number.isInteger(row.riparazioniAttive)).toBe(true);
      expect(Number(row.riparazioniAttive)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("AC-2 - Include only role TECNICO", () => {
  it("Tests AC-2: Given mixed roles in dataset When GET /api/dashboard/carico-tecnici as ADMIN Then only technician ids are returned", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("ADMIN", 7010));

    expect(response.status).toBe(200);
    const tecnicoIds = (response.body as Array<{ tecnicoId: number }>).map(
      (row) => row.tecnicoId,
    );
    expect(tecnicoIds).toContain(7);
    expect(tecnicoIds).toContain(8);
    expect(tecnicoIds).not.toContain(1);
    expect(tecnicoIds).not.toContain(9);
  });

  it("Tests AC-2: Given ADMIN auth When response arrives Then non-tecnico usernames are not returned", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("ADMIN", 7011));

    expect(response.status).toBe(200);
    const usernames = (response.body as Array<{ username: string }>).map(
      (row) => row.username,
    );
    expect(usernames).not.toContain("admin");
    expect(usernames).not.toContain("commerciale");
  });
});

describe("AC-3 - Admin only endpoint", () => {
  it("Tests AC-3: Given TECNICO auth When GET /api/dashboard/carico-tecnici Then returns 403 FORBIDDEN with Admin only message", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: "FORBIDDEN", message: "Admin only" },
    });
  });

  it("Tests AC-3: Given TECNICO auth When GET /api/dashboard/carico-tecnici Then response has no workload payload", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("TECNICO", 8));

    expect(response.status).toBe(403);
    expect(response.body).not.toHaveProperty("caricoTecnici");
    expect(Array.isArray(response.body)).toBe(false);
  });
});
