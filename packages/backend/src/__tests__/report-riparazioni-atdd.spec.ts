import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import {
  cambiaStatoRiparazione,
  createRiparazione,
  resetRiparazioniStoreForTests,
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

function authHeader(role: Role, userId: number): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

const BASE_REPAIR_INPUT = {
  clienteId: 5,
  tipoDispositivo: "Notebook",
  marcaDispositivo: "Dell",
  modelloDispositivo: "Latitude",
  descrizioneProblema: "No power",
  accessoriConsegnati: "alimentatore",
  priorita: "NORMALE",
};

function plusDays(startIso: string, days: number): string {
  const base = new Date(startIso);
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

async function createRepairAt(
  serial: string,
  tecnicoId: number,
  createdAtIso: string,
): Promise<number> {
  vi.setSystemTime(new Date(createdAtIso));
  const created = await createRiparazione({
    actorUserId: tecnicoId,
    ...BASE_REPAIR_INPUT,
    serialeDispositivo: serial,
  });
  expect(created.ok).toBe(true);
  if (!created.ok) {
    throw new Error("FAILED_CREATE_REPAIR_FOR_TEST");
  }
  return created.data.id;
}

async function moveToStateAt(
  riparazioneId: number,
  stato: string,
  atIso: string,
): Promise<void> {
  vi.setSystemTime(new Date(atIso));
  const result = await cambiaStatoRiparazione({
    riparazioneId,
    actorUserId: 1,
    actorRole: "ADMIN",
    stato,
    note: "seed transition",
  });
  if (!result.ok) {
    throw new Error(`FAILED_STATE_CHANGE:${stato}:${result.code}`);
  }
}

async function seedReportScenario(): Promise<void> {
  const januaryBase = "2026-01-05T08:00:00.000Z";

  for (let i = 0; i < 20; i += 1) {
    const tecnicoId = i < 16 ? 7 : 8;
    const createdAt = plusDays(januaryBase, i);
    const repairId = await createRepairAt(`SN-6-4-COMP-${i + 1}`, tecnicoId, createdAt);

    await moveToStateAt(repairId, "IN_DIAGNOSI", plusDays(createdAt, 0));
    await moveToStateAt(repairId, "IN_LAVORAZIONE", plusDays(createdAt, 2.5));
    await moveToStateAt(repairId, "COMPLETATA", plusDays(createdAt, 7.5));
  }

  await createRepairAt("SN-6-4-RIC-1", 7, "2026-01-26T09:00:00.000Z");

  for (let i = 0; i < 4; i += 1) {
    const tecnicoId = i < 2 ? 7 : 8;
    const createdAt = plusDays("2026-01-27T10:00:00.000Z", i);
    const repairId = await createRepairAt(`SN-6-4-ANN-${i + 1}`, tecnicoId, createdAt);
    await moveToStateAt(repairId, "ANNULLATA", plusDays(createdAt, 1));
  }
}

beforeEach(async () => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();

  vi.useFakeTimers();
  await seedReportScenario();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Report gennaio con aggregati completi", () => {
  it("Tests AC-1: Given January 2026 range When GET /api/report/riparazioni Then returns 200 with aggregate keys", async () => {
    const response = await request(app)
      .get("/api/report/riparazioni?dateFrom=2026-01-01&dateTo=2026-01-31")
      .set("Authorization", authHeader("ADMIN", 6401));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totaleRiparazioni");
    expect(response.body).toHaveProperty("completate");
    expect(response.body).toHaveProperty("tempoMedioPerStato");
    expect(response.body).toHaveProperty("tassoCompletamento");
    expect(response.body).toHaveProperty("countPerStato");
  });

  it("Tests AC-1: Given January 2026 range When report is returned Then exact expected values are present", async () => {
    const response = await request(app)
      .get("/api/report/riparazioni?dateFrom=2026-01-01&dateTo=2026-01-31")
      .set("Authorization", authHeader("ADMIN", 6402));

    expect(response.status).toBe(200);
    expect(response.body.totaleRiparazioni).toBe(25);
    expect(response.body.completate).toBe(20);
    expect(response.body.tassoCompletamento).toBe(80.0);
    expect(response.body.countPerStato).toMatchObject({
      RICEVUTA: 1,
      COMPLETATA: 20,
      ANNULLATA: 4,
    });
  });
});

describe("AC-2 - Filtro per tecnico", () => {
  it("Tests AC-2: Given tecnicoId=7 filter When GET /api/report/riparazioni Then returns 200", async () => {
    const response = await request(app)
      .get("/api/report/riparazioni?tecnicoId=7")
      .set("Authorization", authHeader("ADMIN", 6403));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totaleRiparazioni");
    expect(response.body).toHaveProperty("countPerStato");
    expect(response.body.tecnicoId).toBe(7);
  });

  it("Tests AC-2: Given tecnicoId=7 filter When report is returned Then data excludes other technicians", async () => {
    const response = await request(app)
      .get("/api/report/riparazioni?tecnicoId=7")
      .set("Authorization", authHeader("ADMIN", 6404));

    expect(response.status).toBe(200);
    expect(response.body.totaleRiparazioni).toBe(19);
    expect(response.body.countPerStato).toMatchObject({
      COMPLETATA: 16,
      RICEVUTA: 1,
      ANNULLATA: 2,
    });
    expect(response.body.countPerStato).not.toHaveProperty("IN_DIAGNOSI");
  });
});

describe("AC-3 - Endpoint solo Admin", () => {
  it("Tests AC-3: Given TECNICO role When GET /api/report/riparazioni Then returns 403 FORBIDDEN", async () => {
    const response = await request(app)
      .get("/api/report/riparazioni")
      .set("Authorization", authHeader("TECNICO", 6405));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: "FORBIDDEN", message: "Admin only" },
    });
  });

  it("Tests AC-3: Given TECNICO role When forbidden response is returned Then no report payload is exposed", async () => {
    const response = await request(app)
      .get("/api/report/riparazioni")
      .set("Authorization", authHeader("TECNICO", 6406));

    expect(response.status).toBe(403);
    expect(response.body).not.toHaveProperty("totaleRiparazioni");
    expect(response.body).not.toHaveProperty("tempoMedioPerStato");
  });
});

describe("AC-4 - Tempo medio per stato", () => {
  it("Tests AC-4: Given varying durations When GET /api/report/riparazioni Then response includes tempoMedioPerStato object", async () => {
    const response = await request(app)
      .get("/api/report/riparazioni")
      .set("Authorization", authHeader("ADMIN", 6407));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("tempoMedioPerStato");
    expect(response.body.tempoMedioPerStato).toHaveProperty("IN_DIAGNOSI");
    expect(response.body.tempoMedioPerStato).toHaveProperty("IN_LAVORAZIONE");
  });

  it("Tests AC-4: Given varying durations When report is returned Then averages match expected values", async () => {
    const response = await request(app)
      .get("/api/report/riparazioni")
      .set("Authorization", authHeader("ADMIN", 6408));

    expect(response.status).toBe(200);
    expect(response.body.tempoMedioPerStato.IN_DIAGNOSI).toBe(2.5);
    expect(response.body.tempoMedioPerStato.IN_LAVORAZIONE).toBe(5.0);
    expect(Object.keys(response.body.tempoMedioPerStato)).not.toContain("RICEVUTA");
  });
});

describe("Sad path - Validazione query", () => {
  it("Given invalid date range When GET /api/report/riparazioni Then returns 400 VALIDATION_ERROR", async () => {
    const response = await request(app)
      .get("/api/report/riparazioni?dateFrom=2026-01-31&dateTo=2026-01-01")
      .set("Authorization", authHeader("ADMIN", 6409));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("Given invalid tecnicoId When GET /api/report/riparazioni Then returns 400 VALIDATION_ERROR", async () => {
    const response = await request(app)
      .get("/api/report/riparazioni?tecnicoId=abc")
      .set("Authorization", authHeader("ADMIN", 6410));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
