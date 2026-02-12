import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import {
  countFattureByRiparazioneForTests,
  resetFattureStoreForTests,
  setFatturaSequenceForTests,
} from "../services/fatture-service.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
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

function authHeader(role: Role, userId = 5100): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildRiparazionePayload(index: number): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: "Apple",
    modelloDispositivo: `iPhone-${index}`,
    serialeDispositivo: `SN-FAT-${index}`,
    descrizioneProblema: "Batteria degradata",
    accessoriConsegnati: "Cavo USB-C",
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
      .set("Authorization", authHeader("TECNICO", 5200 + index))
      .send(buildRiparazionePayload(index));

    expect(response.status).toBe(201);
    expect(response.body?.id).toBe(index);
  }
}

async function createApprovedPreventivo(riparazioneId: number): Promise<number> {
  const createResponse = await request(app)
    .post("/api/preventivi")
    .set("Authorization", authHeader("TECNICO", 5300 + riparazioneId))
    .send(buildPreventivoPayload(riparazioneId));

  expect(createResponse.status).toBe(201);
  const preventivoId = createResponse.body?.id as number;

  setPreventivoStatoForTests(preventivoId, "INVIATO");

  const approveResponse = await request(app)
    .patch(`/api/preventivi/${preventivoId}/risposta`)
    .set("Authorization", authHeader("COMMERCIALE", 5400 + riparazioneId))
    .send({ approvato: true });

  expect(approveResponse.status).toBe(200);
  expect(approveResponse.body?.data?.stato).toBe("APPROVATO");

  return preventivoId;
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

describe("AC-1 - Creazione fattura da preventivo approvato", () => {
  it("Tests AC-1: Given preventivo id=5 APPROVATO con totale 244.00 When POST /api/fatture { riparazioneId: 10 } Then HTTP 201 con numeroFattura 2026/0001 e importi 200/44/244", async () => {
    await seedRiparazioniUntil(10);
    await createApprovedPreventivo(10);

    const response = await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5501))
      .send({ riparazioneId: 10 });

    expect(response.status).toBe(201);
    expect(response.body?.data?.numeroFattura).toBe("2026/0001");
    expect(response.body?.data?.subtotale).toBe(200);
    expect(response.body?.data?.iva).toBe(44);
    expect(response.body?.data?.totale).toBe(244);
  });

  it("Tests AC-1: Given preventivo approvato per riparazione 10 When genero fattura Then risposta include stato EMESSA, riparazioneId=10 e pdfPath non vuoto", async () => {
    await seedRiparazioniUntil(10);
    await createApprovedPreventivo(10);

    const response = await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5502))
      .send({ riparazioneId: 10 });

    expect(response.status).toBe(201);
    expect(response.body?.data?.stato).toBe("EMESSA");
    expect(response.body?.data?.riparazioneId).toBe(10);
    expect(typeof response.body?.data?.pdfPath).toBe("string");
    expect((response.body?.data?.pdfPath as string)?.length).toBeGreaterThan(0);
  });
});

describe("AC-2 - Sequenza numeroFattura", () => {
  it("Tests AC-2: Given ultima fattura 2026/0015 e riparazione 11 approvata When POST /api/fatture { riparazioneId: 11 } Then numeroFattura 2026/0016", async () => {
    await seedRiparazioniUntil(11);
    await createApprovedPreventivo(11);
    setFatturaSequenceForTests(2026, 15);

    const response = await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5601))
      .send({ riparazioneId: 11 });

    expect(response.status).toBe(201);
    expect(response.body?.data?.numeroFattura).toBe("2026/0016");
  });

  it("Tests AC-2: Given due emissioni consecutive nello stesso anno When genero fatture Then la numerazione e' crescente e senza duplicati", async () => {
    await seedRiparazioniUntil(12);
    await createApprovedPreventivo(11);
    await createApprovedPreventivo(12);
    setFatturaSequenceForTests(2026, 14);

    const firstInvoice = await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5603))
      .send({ riparazioneId: 11 });

    const secondInvoice = await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5604))
      .send({ riparazioneId: 12 });

    expect(firstInvoice.status).toBe(201);
    expect(secondInvoice.status).toBe(201);
    expect(firstInvoice.body?.data?.numeroFattura).not.toBe(secondInvoice.body?.data?.numeroFattura);
    expect(firstInvoice.body?.data?.numeroFattura).toBe("2026/0015");
    expect(secondInvoice.body?.data?.numeroFattura).toBe("2026/0016");
  });
});

describe("AC-3 - Nessun preventivo approvato", () => {
  it('Tests AC-3: Given riparazione id=10 senza preventivo APPROVATO When POST /api/fatture { riparazioneId: 10 } Then HTTP 400 con errore "No approved preventivo found for this riparazione"', async () => {
    await seedRiparazioniUntil(10);

    const response = await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5701))
      .send({ riparazioneId: 10 });

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe("No approved preventivo found for this riparazione");
    expect(response.body?.error?.code).toBe("NO_APPROVED_PREVENTIVO");
  });

  it("Tests AC-3: Given riparazione senza preventivo approvato When genero fattura Then nessun id fattura viene restituito", async () => {
    await seedRiparazioniUntil(10);

    const response = await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5702))
      .send({ riparazioneId: 10 });

    expect(response.status).toBe(400);
    expect(response.body?.data?.id).toBeUndefined();
    expect(response.body?.data?.numeroFattura).toBeUndefined();
  });
});

describe("AC-4 - Fattura gia' esistente", () => {
  it('Tests AC-4: Given esiste gia fattura per riparazione id=10 When POST /api/fatture { riparazioneId: 10 } Then HTTP 409 con errore "Invoice already exists for this riparazione"', async () => {
    await seedRiparazioniUntil(10);
    await createApprovedPreventivo(10);

    const first = await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5801))
      .send({ riparazioneId: 10 });

    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5802))
      .send({ riparazioneId: 10 });

    expect(second.status).toBe(409);
    expect(second.body?.error?.message).toBe("Invoice already exists for this riparazione");
    expect(second.body?.error?.code).toBe("INVOICE_ALREADY_EXISTS");
  });

  it("Tests AC-4: Given prima emissione gia effettuata su riparazione 10 When ripeto POST /api/fatture Then la seconda risposta non restituisce nuova fattura", async () => {
    await seedRiparazioniUntil(10);
    await createApprovedPreventivo(10);

    await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5803))
      .send({ riparazioneId: 10 });
    expect(countFattureByRiparazioneForTests(10)).toBe(1);

    const duplicate = await request(app)
      .post("/api/fatture")
      .set("Authorization", authHeader("COMMERCIALE", 5804))
      .send({ riparazioneId: 10 });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body?.data?.id).toBeUndefined();
    expect(duplicate.body?.data?.numeroFattura).toBeUndefined();
    expect(countFattureByRiparazioneForTests(10)).toBe(1);
  });
});
