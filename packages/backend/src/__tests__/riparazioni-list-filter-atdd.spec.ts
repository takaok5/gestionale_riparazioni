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

function authHeader(role: Role, userId = 7000): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildRiparazionePayload(
  index: number,
  overrides?: Partial<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: index % 2 === 0 ? "Samsung" : "Apple",
    modelloDispositivo: `Model-${index}`,
    serialeDispositivo: `SN-LIST-${index}`,
    descrizioneProblema: `Problema ${index}`,
    accessoriConsegnati: "Caricabatterie",
    priorita: index % 3 === 0 ? "ALTA" : "NORMALE",
    ...overrides,
  };
}

async function createRiparazione(
  index: number,
  overrides?: Partial<Record<string, unknown>>,
  userId = 7100,
) {
  return request(app)
    .post("/api/riparazioni")
    .set("Authorization", authHeader("TECNICO", userId))
    .send(buildRiparazionePayload(index, overrides));
}

async function createRiparazioneAt(
  isoDate: string,
  index: number,
  overrides?: Partial<Record<string, unknown>>,
  userId = 7200,
) {
  vi.setSystemTime(new Date(isoDate));
  return createRiparazione(index, overrides, userId);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-09T10:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Lista riparazioni paginata", () => {
  it("tests AC-1: Given 30 repairs exist When GET /api/riparazioni?page=1&limit=15 Then returns 200 with 15 rows and meta {page:1,limit:15,total:30,totalPages:2}", async () => {
    for (let index = 1; index <= 30; index += 1) {
      const created = await createRiparazione(index, undefined, 7300 + index);
      expect(created.status).toBe(201);
    }

    const response = await request(app)
      .get("/api/riparazioni?page=1&limit=15")
      .set("Authorization", authHeader("TECNICO", 7401));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(15);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(15);
    expect(response.body.meta.total).toBe(30);
    expect(response.body.meta.totalPages).toBe(2);
  });

  it("tests AC-1: Given list endpoint is paginated When page 1 is requested Then ordering is deterministic by dataRicezione desc", async () => {
    const first = await createRiparazioneAt("2026-02-09T08:00:00.000Z", 101);
    const second = await createRiparazioneAt("2026-02-09T09:00:00.000Z", 102);
    const third = await createRiparazioneAt("2026-02-09T10:00:00.000Z", 103);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(third.status).toBe(201);

    const response = await request(app)
      .get("/api/riparazioni?page=1&limit=15")
      .set("Authorization", authHeader("TECNICO", 7402));

    const rows = (response.body.data ?? []) as Array<{ dataRicezione?: string }>;

    expect(response.status).toBe(200);
    expect(rows.length).toBeGreaterThan(0);
    if (rows.length >= 2) {
      expect(new Date(rows[0].dataRicezione ?? "").getTime()).toBeGreaterThanOrEqual(
        new Date(rows[1].dataRicezione ?? "").getTime(),
      );
    }
  });
});

describe("AC-2 - Filtro per stato IN_LAVORAZIONE", () => {
  it("tests AC-2: Given repairs exist When GET /api/riparazioni?stato=IN_LAVORAZIONE Then all returned rows have stato IN_LAVORAZIONE", async () => {
    const created1 = await createRiparazione(201, { priorita: "NORMALE" }, 7501);
    const created2 = await createRiparazione(202, { priorita: "ALTA" }, 7502);

    expect(created1.status).toBe(201);
    expect(created2.status).toBe(201);
    setRiparazioneStatoForTests(created1.body.id as number, "IN_LAVORAZIONE");
    setRiparazioneStatoForTests(created2.body.id as number, "RICEVUTA");

    const response = await request(app)
      .get("/api/riparazioni?stato=IN_LAVORAZIONE")
      .set("Authorization", authHeader("TECNICO", 7503));

    const rows = (response.body.data ?? []) as Array<{ stato?: string }>;

    expect(response.status).toBe(200);
    expect(rows.every((row) => row.stato === "IN_LAVORAZIONE")).toBe(true);
  });

  it("tests AC-2: Given stato filter is active When GET /api/riparazioni?stato=IN_LAVORAZIONE Then no row with stato different from IN_LAVORAZIONE is returned", async () => {
    const createdInLavorazione = await createRiparazione(203, { priorita: "NORMALE" }, 7504);
    const createdRicevuta = await createRiparazione(204, { priorita: "NORMALE" }, 7505);
    expect(createdInLavorazione.status).toBe(201);
    expect(createdRicevuta.status).toBe(201);
    setRiparazioneStatoForTests(
      createdInLavorazione.body.id as number,
      "IN_LAVORAZIONE",
    );
    setRiparazioneStatoForTests(createdRicevuta.body.id as number, "RICEVUTA");

    const response = await request(app)
      .get("/api/riparazioni?stato=IN_LAVORAZIONE")
      .set("Authorization", authHeader("TECNICO", 7506));

    const rows = (response.body.data ?? []) as Array<{ stato?: string }>;

    expect(response.status).toBe(200);
    expect(rows.some((row) => row.stato !== "IN_LAVORAZIONE")).toBe(false);
  });
});

describe("AC-3 - Filtro per tecnicoId", () => {
  it("tests AC-3: Given repairs are assigned to tecnico id=3 When GET /api/riparazioni?tecnicoId=3 Then all rows belong to tecnicoId=3", async () => {
    const ownA = await createRiparazione(301, undefined, 3);
    const ownB = await createRiparazione(302, undefined, 3);
    const other = await createRiparazione(303, undefined, 8);

    expect(ownA.status).toBe(201);
    expect(ownB.status).toBe(201);
    expect(other.status).toBe(201);

    const response = await request(app)
      .get("/api/riparazioni?tecnicoId=3")
      .set("Authorization", authHeader("TECNICO", 7601));

    const rows = (response.body.data ?? []) as Array<{ tecnicoId?: number }>;

    expect(response.status).toBe(200);
    expect(rows.every((row) => row.tecnicoId === 3)).toBe(true);
  });

  it("tests AC-3: Given records exist for tecnicoId=3 and tecnicoId=8 When filtering tecnicoId=3 Then result excludes tecnicoId=8", async () => {
    const own = await createRiparazione(304, undefined, 3);
    const other = await createRiparazione(305, undefined, 8);

    expect(own.status).toBe(201);
    expect(other.status).toBe(201);

    const response = await request(app)
      .get("/api/riparazioni?tecnicoId=3")
      .set("Authorization", authHeader("TECNICO", 7602));

    const rows = (response.body.data ?? []) as Array<{ tecnicoId?: number }>;

    expect(response.status).toBe(200);
    expect(rows.some((row) => row.tecnicoId === 8)).toBe(false);
  });
});

describe("AC-4 - Filtro per priorita ALTA", () => {
  it("tests AC-4: Given ALTA and NORMALE repairs exist When GET /api/riparazioni?priorita=ALTA Then all rows have priorita ALTA", async () => {
    const alta = await createRiparazione(401, { priorita: "ALTA" }, 7701);
    const normale = await createRiparazione(402, { priorita: "NORMALE" }, 7702);

    expect(alta.status).toBe(201);
    expect(normale.status).toBe(201);

    const response = await request(app)
      .get("/api/riparazioni?priorita=ALTA")
      .set("Authorization", authHeader("TECNICO", 7703));

    const rows = (response.body.data ?? []) as Array<{ priorita?: string }>;

    expect(response.status).toBe(200);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.priorita === "ALTA")).toBe(true);
  });

  it("tests AC-4: Given ALTA and NORMALE repairs exist When filtering priorita ALTA Then result excludes priorita NORMALE", async () => {
    const alta = await createRiparazione(403, { priorita: "ALTA" }, 7704);
    const normale = await createRiparazione(404, { priorita: "NORMALE" }, 7705);

    expect(alta.status).toBe(201);
    expect(normale.status).toBe(201);

    const response = await request(app)
      .get("/api/riparazioni?priorita=ALTA")
      .set("Authorization", authHeader("TECNICO", 7706));

    const rows = (response.body.data ?? []) as Array<{ priorita?: string }>;

    expect(response.status).toBe(200);
    expect(rows.some((row) => row.priorita === "NORMALE")).toBe(false);
  });
});

describe("AC-5 - Filtro per range data ricezione", () => {
  it("tests AC-5: Given repairs across different days When filtering 2026-02-01..2026-02-10 Then returns only rows in the inclusive range", async () => {
    const outBefore = await createRiparazioneAt("2026-01-31T10:00:00.000Z", 501);
    const inStart = await createRiparazioneAt("2026-02-01T00:00:00.000Z", 502);
    const inMiddle = await createRiparazioneAt("2026-02-05T12:00:00.000Z", 503);
    const inEnd = await createRiparazioneAt("2026-02-10T23:59:59.000Z", 504);
    const outAfter = await createRiparazioneAt("2026-02-11T08:00:00.000Z", 505);

    expect(outBefore.status).toBe(201);
    expect(inStart.status).toBe(201);
    expect(inMiddle.status).toBe(201);
    expect(inEnd.status).toBe(201);
    expect(outAfter.status).toBe(201);

    const response = await request(app)
      .get("/api/riparazioni?dataRicezioneDa=2026-02-01&dataRicezioneA=2026-02-10")
      .set("Authorization", authHeader("TECNICO", 7801));

    const rows = (response.body.data ?? []) as Array<{ dataRicezione?: string }>;
    const from = new Date("2026-02-01T00:00:00.000Z").getTime();
    const to = new Date("2026-02-10T23:59:59.999Z").getTime();

    expect(response.status).toBe(200);
    expect(
      rows.every((row) => {
        const value = new Date(row.dataRicezione ?? "").getTime();
        return value >= from && value <= to;
      }),
    ).toBe(true);
  });

  it("tests AC-5: Given rows exist on both boundaries When filtering range 2026-02-01..2026-02-10 Then both boundaries are included", async () => {
    const startBoundary = await createRiparazioneAt("2026-02-01T00:00:00.000Z", 506);
    const endBoundary = await createRiparazioneAt("2026-02-10T23:59:59.000Z", 507);

    expect(startBoundary.status).toBe(201);
    expect(endBoundary.status).toBe(201);

    const response = await request(app)
      .get("/api/riparazioni?dataRicezioneDa=2026-02-01&dataRicezioneA=2026-02-10")
      .set("Authorization", authHeader("TECNICO", 7802));

    const rows = (response.body.data ?? []) as Array<{ dataRicezione?: string }>;

    expect(response.status).toBe(200);
    expect(rows.some((row) => row.dataRicezione?.startsWith("2026-02-01"))).toBe(
      true,
    );
    expect(rows.some((row) => row.dataRicezione?.startsWith("2026-02-10"))).toBe(
      true,
    );
  });
});

describe("AC-6 - Ricerca per Galaxy", () => {
  it("tests AC-6: Given rows with modello/marca/codice including Galaxy exist When GET /api/riparazioni?search=Galaxy Then all returned rows match one of those fields", async () => {
    const byModel = await createRiparazione(601, { modelloDispositivo: "Galaxy S21" }, 7901);
    const byBrand = await createRiparazione(602, {
      marcaDispositivo: "GalaxyBrand",
      modelloDispositivo: "XPhone",
    }, 7902);
    const nonMatch = await createRiparazione(603, {
      marcaDispositivo: "Apple",
      modelloDispositivo: "iPhone 14",
    }, 7903);

    expect(byModel.status).toBe(201);
    expect(byBrand.status).toBe(201);
    expect(nonMatch.status).toBe(201);

    const response = await request(app)
      .get("/api/riparazioni?search=Galaxy")
      .set("Authorization", authHeader("TECNICO", 7904));

    const rows = (response.body.data ?? []) as Array<{
      modelloDispositivo?: string;
      marcaDispositivo?: string;
      codiceRiparazione?: string;
    }>;

    expect(response.status).toBe(200);
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((row) => {
        const modello = (row.modelloDispositivo ?? "").toLowerCase();
        const marca = (row.marcaDispositivo ?? "").toLowerCase();
        const codice = (row.codiceRiparazione ?? "").toLowerCase();
        return (
          modello.includes("galaxy") ||
          marca.includes("galaxy") ||
          codice.includes("galaxy")
        );
      }),
    ).toBe(true);
  });

  it("tests AC-6: Given search is case-insensitive When GET /api/riparazioni?search=Galaxy Then result excludes non matching values", async () => {
    const matchUpper = await createRiparazione(604, { modelloDispositivo: "GALAXY NOTE" }, 7905);
    const nonMatch = await createRiparazione(605, { modelloDispositivo: "Pixel 9" }, 7906);

    expect(matchUpper.status).toBe(201);
    expect(nonMatch.status).toBe(201);

    const response = await request(app)
      .get("/api/riparazioni?search=Galaxy")
      .set("Authorization", authHeader("TECNICO", 7907));

    const rows = (response.body.data ?? []) as Array<{ modelloDispositivo?: string }>;

    expect(response.status).toBe(200);
    expect(
      rows.some((row) => (row.modelloDispositivo ?? "").toLowerCase() === "pixel 9"),
    ).toBe(false);
  });
});

describe("AC-7 - Sad path limit oltre massimo", () => {
  it("tests AC-7: Given max limit is 100 When GET /api/riparazioni?limit=1000 Then returns 400 VALIDATION_ERROR", async () => {
    const response = await request(app)
      .get("/api/riparazioni?limit=1000")
      .set("Authorization", authHeader("TECNICO", 8001));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.field).toBe("limit");
  });

  it("tests AC-7: Given invalid high limit When request fails Then details rule is too_large", async () => {
    const response = await request(app)
      .get("/api/riparazioni?limit=1000")
      .set("Authorization", authHeader("TECNICO", 8002));

    expect(response.status).toBe(400);
    expect(response.body.error.details.field).toBe("limit");
    expect(response.body.error.details.rule).toBe("too_large");
  });
});
