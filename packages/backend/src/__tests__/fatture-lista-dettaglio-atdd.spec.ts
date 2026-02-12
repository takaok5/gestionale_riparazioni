import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import { resetFattureStoreForTests } from "../services/fatture-service.js";
import {
  resetPreventiviStoreForTests,
  setPreventivoStatoForTests,
} from "../services/preventivi-service.js";
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

function authHeader(role: Role, userId = 8100): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildRiparazionePayload(index: number): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: "Apple",
    modelloDispositivo: `iPhone-list-${index}`,
    serialeDispositivo: `SN-LISTFAT-${index}`,
    descrizioneProblema: "Batteria degradata",
    accessoriConsegnati: "Caricabatterie",
    priorita: "NORMALE",
  };
}

function buildPreventivoPayload(riparazioneId: number): Record<string, unknown> {
  return {
    riparazioneId,
    voci: [
      {
        tipo: "MANODOPERA",
        descrizione: "Diagnostica",
        quantita: 1,
        prezzoUnitario: 80.0,
      },
      {
        tipo: "RICAMBIO",
        descrizione: "Batteria",
        articoloId: 5,
        quantita: 1,
        prezzoUnitario: 120.0,
      },
    ],
  };
}

async function seedRiparazioniUntil(maxId: number): Promise<void> {
  for (let index = 1; index <= maxId; index += 1) {
    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 8200 + index))
      .send(buildRiparazionePayload(index));

    expect(response.status).toBe(201);
  }
}

async function createApprovedPreventivo(riparazioneId: number): Promise<number> {
  const createResponse = await request(app)
    .post("/api/preventivi")
    .set("Authorization", authHeader("TECNICO", 8300 + riparazioneId))
    .send(buildPreventivoPayload(riparazioneId));

  expect(createResponse.status).toBe(201);
  const preventivoId = createResponse.body?.id as number;

  setPreventivoStatoForTests(preventivoId, "INVIATO");

  const approveResponse = await request(app)
    .patch(`/api/preventivi/${preventivoId}/risposta`)
    .set("Authorization", authHeader("COMMERCIALE", 8400 + riparazioneId))
    .send({ approvato: true });

  expect(approveResponse.status).toBe(200);
  expect(approveResponse.body?.data?.stato).toBe("APPROVATO");

  return preventivoId;
}

async function createFatturaForRiparazione(riparazioneId: number): Promise<number> {
  const response = await request(app)
    .post("/api/fatture")
    .set("Authorization", authHeader("COMMERCIALE", 8500 + riparazioneId))
    .send({ riparazioneId });

  expect(response.status).toBe(201);
  return response.body?.data?.id as number;
}

async function seedFattureUntil(targetId: number): Promise<number> {
  await seedRiparazioniUntil(targetId);

  let currentFatturaId = 0;
  for (let riparazioneId = 1; riparazioneId <= targetId; riparazioneId += 1) {
    await createApprovedPreventivo(riparazioneId);
    currentFatturaId = await createFatturaForRiparazione(riparazioneId);
  }

  return currentFatturaId;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-09T09:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  resetPreventiviStoreForTests();
  resetFattureStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Lista fatture paginata", () => {
  it("Tests AC-1: Given 20 fatture exist When I GET /api/fatture?page=1&limit=10 Then I receive 200 with data array of 10 fatture and meta { page: 1, limit: 10, total: 20 }", async () => {
    const lastId = await seedFattureUntil(20);
    expect(lastId).toBe(20);

    const response = await request(app)
      .get("/api/fatture?page=1&limit=10")
      .set("Authorization", authHeader("COMMERCIALE", 8601));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data)).toBe(true);
    expect(response.body?.data?.length).toBe(10);
    expect(response.body?.meta?.page).toBe(1);
    expect(response.body?.meta?.limit).toBe(10);
    expect(response.body?.meta?.total).toBe(20);
  });

  it("Tests AC-1: Given 20 fatture exist When I GET /api/fatture?page=1&limit=10 Then response keeps deterministic first page boundaries", async () => {
    await seedFattureUntil(20);

    const response = await request(app)
      .get("/api/fatture?page=1&limit=10")
      .set("Authorization", authHeader("COMMERCIALE", 8602));

    expect(response.status).toBe(200);
    expect(response.body?.data?.[0]?.id).toBeDefined();
    expect(response.body?.data?.[9]?.id).toBeDefined();
    expect(response.body?.data?.[10]).toBeUndefined();
  });
});

describe("AC-2 - Filtro stato PAGATA", () => {
  it("Tests AC-2: Given fatture with stato EMESSA and PAGATA exist When I GET /api/fatture?stato=PAGATA Then I receive only fatture with stato PAGATA", async () => {
    await seedFattureUntil(4);

    const pay1 = await request(app)
      .post("/api/fatture/1/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 8611))
      .send({ importo: 244.0, metodo: "BONIFICO" });
    const pay2 = await request(app)
      .post("/api/fatture/3/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 8612))
      .send({ importo: 244.0, metodo: "CONTANTE" });
    expect(pay1.status).toBe(201);
    expect(pay2.status).toBe(201);

    const response = await request(app)
      .get("/api/fatture?stato=PAGATA")
      .set("Authorization", authHeader("COMMERCIALE", 8613));

    expect(response.status).toBe(200);
    expect((response.body?.data as Array<{ stato?: string }>).length).toBeGreaterThan(0);
    expect(
      (response.body?.data as Array<{ stato?: string }>).every(
        (fattura) => fattura.stato === "PAGATA",
      ),
    ).toBe(true);
  });

  it("Tests AC-2: Given fatture with stato EMESSA and PAGATA exist When I GET /api/fatture?stato=PAGATA Then result excludes EMESSA", async () => {
    await seedFattureUntil(2);

    const pay = await request(app)
      .post("/api/fatture/2/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 8614))
      .send({ importo: 244.0, metodo: "BONIFICO" });
    expect(pay.status).toBe(201);

    const response = await request(app)
      .get("/api/fatture?stato=PAGATA")
      .set("Authorization", authHeader("COMMERCIALE", 8615));

    expect(response.status).toBe(200);
    expect(
      (response.body?.data as Array<{ stato?: string }>).some(
        (fattura) => fattura.stato === "EMESSA",
      ),
    ).toBe(false);
  });
});

describe("AC-3 - Filtro range date", () => {
  it("Tests AC-3: Given fatture created in February 2026 exist When I GET /api/fatture?dataDa=2026-02-01&dataA=2026-02-28 Then I receive fatture within that date range", async () => {
    await seedFattureUntil(8);

    const response = await request(app)
      .get("/api/fatture?dataDa=2026-02-01&dataA=2026-02-28")
      .set("Authorization", authHeader("COMMERCIALE", 8621));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data)).toBe(true);
    expect((response.body?.data as Array<{ id?: number }>).length).toBeGreaterThan(0);
  });

  it("Tests AC-3: Given fatture created in February 2026 exist When I GET /api/fatture?dataDa=2026-02-01&dataA=2026-02-28 Then each row has date in requested range", async () => {
    await seedFattureUntil(8);

    const response = await request(app)
      .get("/api/fatture?dataDa=2026-02-01&dataA=2026-02-28")
      .set("Authorization", authHeader("COMMERCIALE", 8622));

    expect(response.status).toBe(200);
    expect(
      (response.body?.data as Array<{ dataEmissione?: string }>).every((fattura) => {
        const date = new Date(fattura.dataEmissione ?? "").getTime();
        return date >= new Date("2026-02-01T00:00:00.000Z").getTime() &&
          date <= new Date("2026-02-28T23:59:59.999Z").getTime();
      }),
    ).toBe(true);
  });
});

describe("AC-4 - Dettaglio fattura con due pagamenti", () => {
  it("Tests AC-4: Given fattura id=8 has 2 pagamenti When I GET /api/fatture/8 Then I receive fattura details with pagamenti array showing both payments", async () => {
    await seedFattureUntil(8);

    const payA = await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 8631))
      .send({ importo: 100.0, metodo: "BONIFICO", dataPagamento: "2026-02-10" });
    const payB = await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 8632))
      .send({ importo: 144.0, metodo: "CONTANTE", dataPagamento: "2026-02-11" });
    expect(payA.status).toBe(201);
    expect(payB.status).toBe(201);

    const response = await request(app)
      .get("/api/fatture/8")
      .set("Authorization", authHeader("COMMERCIALE", 8633));

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(8);
    expect(response.body?.data?.pagamenti?.length).toBe(2);
  });

  it("Tests AC-4: Given fattura id=8 has 2 pagamenti When I GET /api/fatture/8 Then each payment row exposes id/importo/metodo/dataPagamento", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 8634))
      .send({ importo: 100.0, metodo: "BONIFICO", dataPagamento: "2026-02-10" });
    await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 8635))
      .send({ importo: 144.0, metodo: "CONTANTE", dataPagamento: "2026-02-11" });

    const response = await request(app)
      .get("/api/fatture/8")
      .set("Authorization", authHeader("COMMERCIALE", 8636));

    expect(response.status).toBe(200);
    expect(response.body?.data?.pagamenti?.[0]?.id).toBeDefined();
    expect(response.body?.data?.pagamenti?.[0]?.importo).toBeDefined();
    expect(response.body?.data?.pagamenti?.[0]?.metodo).toBeDefined();
    expect(response.body?.data?.pagamenti?.[0]?.dataPagamento).toBeDefined();
  });
});

describe("AC-5 - Download PDF fattura", () => {
  it("Tests AC-5: Given fattura id=8 has generated PDF When I GET /api/fatture/8/pdf Then I receive PDF file with content-type application/pdf and correct filename", async () => {
    await seedFattureUntil(8);

    const response = await request(app)
      .get("/api/fatture/8/pdf")
      .set("Authorization", authHeader("COMMERCIALE", 8641));

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain("filename=");
    expect(response.headers["content-disposition"]).toContain(".pdf");
  });

  it("Tests AC-5: Given fattura id=8 has generated PDF When I GET /api/fatture/8/pdf Then filename includes normalized numeroFattura", async () => {
    await seedFattureUntil(8);

    const response = await request(app)
      .get("/api/fatture/8/pdf")
      .set("Authorization", authHeader("COMMERCIALE", 8642));

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toMatch(/filename=.*2026-0008-8\.pdf/);
  });
});

describe("AC-6 - Sad path limit invalido", () => {
  it("Tests AC-6: Given max limit is 100 When I GET /api/fatture?limit=1000 Then I receive 400 with error.code VALIDATION_ERROR and error.details.field limit", async () => {
    const response = await request(app)
      .get("/api/fatture?limit=1000")
      .set("Authorization", authHeader("COMMERCIALE", 8651));

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
    expect(response.body?.error?.details?.field).toBe("limit");
  });

  it("Tests AC-6: Given max limit is 100 When I GET /api/fatture?limit=1000 Then validation details expose too_large rule", async () => {
    const response = await request(app)
      .get("/api/fatture?limit=1000")
      .set("Authorization", authHeader("COMMERCIALE", 8652));

    expect(response.status).toBe(400);
    expect(response.body?.error?.details?.field).toBe("limit");
    expect(response.body?.error?.details?.rule).toBe("too_large");
  });
});
