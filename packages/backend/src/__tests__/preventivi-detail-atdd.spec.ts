import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
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

function authHeader(role: Role, userId = 5100): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

describe("AC-2 - Dettaglio preventivo con 3 voci", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-12T09:30:00.000Z"));
    resetUsersStoreForTests();
    resetAnagraficheStoreForTests();
    resetRiparazioniStoreForTests();
    resetPreventiviStoreForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Tests AC-2: Given esiste il preventivo id=21 per riparazioneId=10 con 3 voci specifiche When invio GET /api/preventivi/21 Then la risposta include data.voci con esattamente 3 elementi", async () => {
    const response = await request(app)
      .get("/api/preventivi/21")
      .set("Authorization", authHeader("TECNICO", 5201));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data?.voci)).toBe(true);
    expect(response.body?.data?.voci).toHaveLength(3);
    expect(response.body?.data?.voci?.[0]).toEqual(
      expect.objectContaining({
        tipo: "MANODOPERA",
        descrizione: "Diagnosi avanzata",
        quantita: 1,
        prezzoUnitario: 50,
      }),
    );
  });

  it("Tests AC-2: Given preventivo id=21 ha 3 voci (50.00, 120.00, 90.00) When invio GET /api/preventivi/21 Then la risposta espone subtotale=260.00, iva=57.20, totale=317.20", async () => {
    const response = await request(app)
      .get("/api/preventivi/21")
      .set("Authorization", authHeader("TECNICO", 5202));

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(21);
    expect(response.body?.data?.subtotale).toBe(260);
    expect(response.body?.data?.iva).toBe(57.2);
    expect(response.body?.data?.totale).toBe(317.2);
  });
});
