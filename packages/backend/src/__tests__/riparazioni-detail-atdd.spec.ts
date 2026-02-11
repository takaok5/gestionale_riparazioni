import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import {
  resetRiparazioniStoreForTests,
  setRiparazioneStatoForTests,
} from "../services/riparazioni-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign(
    { ...payload, tokenType: "access" as const },
    "test-jwt-secret",
    { expiresIn: "15m" },
  );
}

function authHeader(role: Role, userId = 9000): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildRiparazionePayload(
  index: number,
  overrides?: Partial<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: `Marca-${index}`,
    modelloDispositivo: `Modello-${index}`,
    serialeDispositivo: `SN-DET-${index}`,
    descrizioneProblema: `Problema ${index}`,
    accessoriConsegnati: "Caricabatterie",
    priorita: index % 2 === 0 ? "ALTA" : "NORMALE",
    ...overrides,
  };
}

async function createRiparazione(index: number, userId = 9100) {
  return request(app)
    .post("/api/riparazioni")
    .set("Authorization", authHeader("TECNICO", userId))
    .send(buildRiparazionePayload(index));
}

async function seedUntilRiparazioneId10(): Promise<void> {
  for (let index = 1; index <= 10; index += 1) {
    const created = await createRiparazione(index, 9200 + index);
    expect(created.status).toBe(201);
    expect(created.body.id).toBe(index);
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-11T10:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Dettaglio riparazione con cliente, tecnico e stato corrente", () => {
  it("Tests AC-1: Given riparazione id=10 exists When I GET /api/riparazioni/10 Then I receive 200 with full riparazione data including cliente { id, nome, telefono, email }, tecnico { id, username }, current stato", async () => {
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 9301));

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(10);
    expect(response.body?.data?.cliente).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        nome: expect.any(String),
        telefono: expect.any(String),
        email: expect.any(String),
      }),
    );
    expect(response.body?.data?.tecnico).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        username: expect.any(String),
      }),
    );
    expect(response.body?.data?.stato).toBeTypeOf("string");
  });

  it("Tests AC-1: Given riparazione id=10 exists When I GET /api/riparazioni/10 Then response uses data envelope with expected top-level fields", async () => {
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 9302));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 10,
          cliente: expect.any(Object),
          tecnico: expect.any(Object),
          stato: expect.any(String),
        }),
      }),
    );
  });
});

describe("AC-2 - Storico stati della riparazione", () => {
  it("Tests AC-2: Given riparazione id=10 has changed stato 3 times When I GET /api/riparazioni/10 Then response includes statiHistory array with 3 entries showing { stato, dataOra, userId, note }", async () => {
    await seedUntilRiparazioneId10();
    setRiparazioneStatoForTests(10, "IN_DIAGNOSI");
    setRiparazioneStatoForTests(10, "IN_LAVORAZIONE");
    setRiparazioneStatoForTests(10, "COMPLETATA");

    const response = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 9401));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data?.statiHistory)).toBe(true);
    expect(response.body?.data?.statiHistory).toHaveLength(3);
    for (const row of response.body?.data?.statiHistory ?? []) {
      expect(row).toEqual(
        expect.objectContaining({
          stato: expect.any(String),
          dataOra: expect.any(String),
          userId: expect.any(Number),
          note: expect.anything(),
        }),
      );
    }
  });

  it("Tests AC-2: Given riparazione id=10 has changed stato 3 times When I GET /api/riparazioni/10 Then each statiHistory entry has ISO dataOra", async () => {
    await seedUntilRiparazioneId10();
    setRiparazioneStatoForTests(10, "IN_DIAGNOSI");
    setRiparazioneStatoForTests(10, "IN_LAVORAZIONE");
    setRiparazioneStatoForTests(10, "COMPLETATA");

    const response = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 9402));

    expect(response.status).toBe(200);
    expect(response.body?.data?.statiHistory).toHaveLength(3);
    for (const row of response.body?.data?.statiHistory ?? []) {
      expect(Number.isNaN(Date.parse(String(row?.dataOra ?? "")))).toBe(false);
    }
  });
});

describe("AC-3 - Preventivi e ricambi nel dettaglio", () => {
  it("Tests AC-3: Given riparazione id=10 has 2 preventivi and 5 ricambi When I GET /api/riparazioni/10 Then response includes preventivi array and ricambi array with complete details", async () => {
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 9501));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data?.preventivi)).toBe(true);
    expect(Array.isArray(response.body?.data?.ricambi)).toBe(true);
    expect(response.body?.data?.preventivi).toHaveLength(2);
    expect(response.body?.data?.ricambi).toHaveLength(5);
  });

  it("Tests AC-3: Given riparazione id=10 has 2 preventivi and 5 ricambi When I GET /api/riparazioni/10 Then each preventivo/ricambio row exposes required fields", async () => {
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 9502));

    expect(response.status).toBe(200);
    for (const preventivo of response.body?.data?.preventivi ?? []) {
      expect(preventivo).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          numeroPreventivo: expect.any(String),
          stato: expect.any(String),
          totale: expect.any(Number),
        }),
      );
    }

    for (const ricambio of response.body?.data?.ricambi ?? []) {
      expect(ricambio).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          codiceArticolo: expect.any(String),
          descrizione: expect.any(String),
          quantita: expect.any(Number),
          prezzoUnitario: expect.any(Number),
        }),
      );
    }
  });
});

describe("AC-4 - Riparazione non trovata", () => {
  it("Tests AC-4: Given riparazione id=999 does not exist When I GET /api/riparazioni/999 Then I receive 404 with error RIPARAZIONE_NOT_FOUND", async () => {
    const response = await request(app)
      .get("/api/riparazioni/999")
      .set("Authorization", authHeader("TECNICO", 9601));

    expect(response.status).toBe(404);
    expect(response.body?.error?.code).toBe("RIPARAZIONE_NOT_FOUND");
    expect(response.body?.error?.message).toBe("Riparazione non trovata");
  });

  it("Tests AC-4: Given riparazione id=999 does not exist When I GET /api/riparazioni/999 Then response does not expose data payload", async () => {
    const response = await request(app)
      .get("/api/riparazioni/999")
      .set("Authorization", authHeader("TECNICO", 9602));

    expect(response.status).toBe(404);
    expect(response.body?.data).toBeUndefined();
    expect(response.body?.error).toEqual(
      expect.objectContaining({
        code: "RIPARAZIONE_NOT_FOUND",
      }),
    );
  });
});
