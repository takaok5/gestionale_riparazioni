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

function authHeader(role: Role, userId = 7100): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildRiparazionePayload(index: number): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: "Apple",
    modelloDispositivo: `iPhone-pay-${index}`,
    serialeDispositivo: `SN-PAY-${index}`,
    descrizioneProblema: "Display danneggiato",
    accessoriConsegnati: "Cover",
    priorita: "NORMALE",
  };
}

function buildPreventivoPayload(riparazioneId: number): Record<string, unknown> {
  return {
    riparazioneId,
    voci: [
      {
        tipo: "MANODOPERA",
        descrizione: "Sostituzione schermo",
        quantita: 1,
        prezzoUnitario: 200.0,
      },
    ],
  };
}

async function seedRiparazioniUntil(maxId: number): Promise<void> {
  for (let index = 1; index <= maxId; index += 1) {
    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 7200 + index))
      .send(buildRiparazionePayload(index));

    expect(response.status).toBe(201);
  }
}

async function createApprovedPreventivo(riparazioneId: number): Promise<number> {
  const createResponse = await request(app)
    .post("/api/preventivi")
    .set("Authorization", authHeader("TECNICO", 7300 + riparazioneId))
    .send(buildPreventivoPayload(riparazioneId));

  expect(createResponse.status).toBe(201);
  const preventivoId = createResponse.body?.id as number;

  setPreventivoStatoForTests(preventivoId, "INVIATO");

  const approveResponse = await request(app)
    .patch(`/api/preventivi/${preventivoId}/risposta`)
    .set("Authorization", authHeader("COMMERCIALE", 7400 + riparazioneId))
    .send({ approvato: true });

  expect(approveResponse.status).toBe(200);
  expect(approveResponse.body?.data?.stato).toBe("APPROVATO");

  return preventivoId;
}

async function createFatturaForRiparazione(riparazioneId: number): Promise<number> {
  const response = await request(app)
    .post("/api/fatture")
    .set("Authorization", authHeader("COMMERCIALE", 7500 + riparazioneId))
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

describe("AC-1 - Registrazione pagamento totale", () => {
  it("Tests AC-1: Given fattura id=8 totale 244.00 senza pagamenti When POST /api/fatture/8/pagamenti importo 244.00 Then HTTP 201 e stato PAGATA", async () => {
    const fatturaId = await seedFattureUntil(8);
    expect(fatturaId).toBe(8);

    const response = await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7601))
      .send({ importo: 244.0, metodo: "CONTANTE", dataPagamento: "2026-02-09" });

    expect(response.status).toBe(201);
    expect(response.body?.data?.fatturaId).toBe(8);
    expect(response.body?.data?.importo).toBe(244);
    expect(response.body?.data?.fattura?.stato).toBe("PAGATA");
  });

  it("Tests AC-1: Given pagamento totale registrato When GET /api/fatture/8 Then residuo 0.00", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7602))
      .send({ importo: 244.0, metodo: "CONTANTE", dataPagamento: "2026-02-09" });

    const detailResponse = await request(app)
      .get("/api/fatture/8")
      .set("Authorization", authHeader("COMMERCIALE", 7603));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.id).toBe(8);
    expect(detailResponse.body?.data?.residuo).toBe(0);
  });
});

describe("AC-2 - Registrazione pagamento parziale + saldo", () => {
  it("Tests AC-2: Given pagamento iniziale 100.00 When POST saldo 144.00 Then totalePagato 244.00 e stato PAGATA", async () => {
    await seedFattureUntil(8);

    const firstPayment = await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7611))
      .send({ importo: 100.0, metodo: "BONIFICO" });

    expect(firstPayment.status).toBe(201);

    const secondPayment = await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7612))
      .send({ importo: 144.0, metodo: "BONIFICO" });

    expect(secondPayment.status).toBe(201);
    expect(secondPayment.body?.data?.fattura?.totalePagato).toBe(244);
    expect(secondPayment.body?.data?.fattura?.residuo).toBe(0);
    expect(secondPayment.body?.data?.fattura?.stato).toBe("PAGATA");
  });

  it("Tests AC-2: Given due pagamenti 100+144 When GET /api/fatture/8 Then pagamenti length 2", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7613))
      .send({ importo: 100.0, metodo: "BONIFICO" });

    await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7614))
      .send({ importo: 144.0, metodo: "BONIFICO" });

    const detailResponse = await request(app)
      .get("/api/fatture/8")
      .set("Authorization", authHeader("COMMERCIALE", 7615));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.pagamenti?.length).toBe(2);
  });
});

describe("AC-3 - Blocco overpayment", () => {
  it("Tests AC-3: Given fattura gia saldata 244.00 When POST importo 10.00 Then HTTP 400 con messaggio overpayment", async () => {
    await seedFattureUntil(8);

    const fullPayment = await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7621))
      .send({ importo: 244.0, metodo: "CONTANTE" });

    expect(fullPayment.status).toBe(201);

    const overpayment = await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7622))
      .send({ importo: 10.0, metodo: "CONTANTE" });

    expect(overpayment.status).toBe(400);
    expect(overpayment.body?.error?.message).toBe(
      "Total payments would exceed invoice total",
    );
  });

  it("Tests AC-3: Given overpayment rifiutato When GET /api/fatture/8 Then numero pagamenti resta invariato", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7623))
      .send({ importo: 244.0, metodo: "CONTANTE" });

    await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7624))
      .send({ importo: 10.0, metodo: "CONTANTE" });

    const detailResponse = await request(app)
      .get("/api/fatture/8")
      .set("Authorization", authHeader("COMMERCIALE", 7625));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.pagamenti?.length).toBe(1);
    expect(detailResponse.body?.data?.residuo).toBe(0);
  });
});

describe("AC-4 - Dettaglio fattura con pagamenti", () => {
  it("Tests AC-4: Given pagamento da 100.00 esiste When GET /api/fatture/8 Then pagamenti include importo 100 e residuo 144", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7631))
      .send({ importo: 100.0, metodo: "BONIFICO" });

    const detailResponse = await request(app)
      .get("/api/fatture/8")
      .set("Authorization", authHeader("COMMERCIALE", 7632));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.id).toBe(8);
    expect(detailResponse.body?.data?.residuo).toBe(144);
  });

  it("Tests AC-4: Given pagamento da 100.00 esiste When GET /api/fatture/8 Then prima riga pagamenti ha importo 100.00", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 7633))
      .send({ importo: 100.0, metodo: "BONIFICO" });

    const detailResponse = await request(app)
      .get("/api/fatture/8")
      .set("Authorization", authHeader("COMMERCIALE", 7634));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.pagamenti?.[0]?.importo).toBe(100);
  });
});
