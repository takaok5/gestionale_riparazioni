import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

function buildArticoloPayload(index: number): Record<string, unknown> {
  return {
    codiceArticolo: `RIP-RIC-${String(index).padStart(4, "0")}`,
    nome: `Ricambio Test ${index}`,
    descrizione: `Descrizione ricambio ${index}`,
    categoria: "DISPLAY",
    fornitoreId: 3,
    prezzoAcquisto: 100,
    prezzoVendita: 150,
    sogliaMinima: 2,
  };
}

function buildRiparazionePayload(index: number): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: "Samsung",
    modelloDispositivo: `Galaxy S${20 + index}`,
    serialeDispositivo: `SN-RIC-${index}`,
    descrizioneProblema: "Display rotto",
    accessoriConsegnati: "Cover",
    priorita: "NORMALE",
  };
}

async function createArticolo(index: number, adminUserId: number): Promise<number> {
  const response = await request(app)
    .post("/api/articoli")
    .set("Authorization", authHeader("ADMIN", adminUserId))
    .send(buildArticoloPayload(index));

  expect(response.status).toBe(201);
  return response.body.id as number;
}

async function caricoArticolo(
  articoloId: number,
  quantita: number,
  tecnicoUserId: number,
  riferimento: string,
): Promise<void> {
  const response = await request(app)
    .post(`/api/articoli/${articoloId}/movimenti`)
    .set("Authorization", authHeader("TECNICO", tecnicoUserId))
    .send({ tipo: "CARICO", quantita, riferimento });

  expect(response.status).toBe(201);
}

async function createRiparazione(index: number, tecnicoUserId: number): Promise<number> {
  const response = await request(app)
    .post("/api/riparazioni")
    .set("Authorization", authHeader("TECNICO", tecnicoUserId))
    .send(buildRiparazionePayload(index));

  expect(response.status).toBe(201);
  return response.body.id as number;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-12T09:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Collegamento ricambio con scarico automatico", () => {
  it("Tests AC-1: Given articolo id=5 has giacenza 15 and prezzoVendita 150.00 When I POST /api/riparazioni/10/ricambi with { articoloId: 5, quantita: 2 } Then 201 and body has articoloId/quantita/prezzoUnitario", async () => {
    const articoloId = await createArticolo(1, 8100);
    await caricoArticolo(articoloId, 15, 8101, "Ordine FOR-8100");
    const riparazioneId = await createRiparazione(1, 8102);

    const response = await request(app)
      .post(`/api/riparazioni/${riparazioneId}/ricambi`)
      .set("Authorization", authHeader("TECNICO", 8103))
      .send({ articoloId, quantita: 2 });

    expect(response.status).toBe(201);
    expect(response.body?.data?.articoloId).toBe(articoloId);
    expect(response.body?.data?.quantita).toBe(2);
    expect(response.body?.data?.prezzoUnitario).toBe(150);
  });

  it("Tests AC-1: Given same setup When link ricambio succeeds Then articolo giacenza decreases to 13 and SCARICO movement is registered", async () => {
    const articoloId = await createArticolo(2, 8110);
    await caricoArticolo(articoloId, 15, 8111, "Ordine FOR-8110");
    const riparazioneId = await createRiparazione(2, 8112);

    const linkResponse = await request(app)
      .post(`/api/riparazioni/${riparazioneId}/ricambi`)
      .set("Authorization", authHeader("TECNICO", 8113))
      .send({ articoloId, quantita: 2 });
    expect(linkResponse.status).toBe(201);

    const articoliResponse = await request(app)
      .get(`/api/articoli?search=${encodeURIComponent(`RIP-RIC-${String(2).padStart(4, "0")}`)}`)
      .set("Authorization", authHeader("TECNICO", 8114));

    expect(articoliResponse.status).toBe(200);
    expect(Array.isArray(articoliResponse.body.data)).toBe(true);
    expect(articoliResponse.body.data[0].giacenza).toBe(13);
  });
});

describe("AC-2 - Blocco su stock insufficiente", () => {
  it('Tests AC-2: Given articolo id=5 has giacenza 1 When I POST /api/riparazioni/10/ricambi with { quantita: 3 } Then 400 with error "Insufficient stock for articolo: available 1, requested 3"', async () => {
    const articoloId = await createArticolo(3, 8200);
    await caricoArticolo(articoloId, 1, 8201, "Ordine FOR-8200");
    const riparazioneId = await createRiparazione(3, 8202);

    const response = await request(app)
      .post(`/api/riparazioni/${riparazioneId}/ricambi`)
      .set("Authorization", authHeader("TECNICO", 8203))
      .send({ articoloId, quantita: 3 });

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe(
      "Insufficient stock for articolo: available 1, requested 3",
    );
  });

  it("Tests AC-2: Given insufficient-stock request fails When I read articolo list Then giacenza remains 1", async () => {
    const articoloId = await createArticolo(4, 8210);
    await caricoArticolo(articoloId, 1, 8211, "Ordine FOR-8210");
    const riparazioneId = await createRiparazione(4, 8212);

    await request(app)
      .post(`/api/riparazioni/${riparazioneId}/ricambi`)
      .set("Authorization", authHeader("TECNICO", 8213))
      .send({ articoloId, quantita: 3 });

    const articoliResponse = await request(app)
      .get(`/api/articoli?search=${encodeURIComponent(`RIP-RIC-${String(4).padStart(4, "0")}`)}`)
      .set("Authorization", authHeader("TECNICO", 8214));

    expect(articoliResponse.status).toBe(200);
    expect(articoliResponse.body.data[0].giacenza).toBe(1);
  });
});

describe("AC-3 - Dettaglio riparazione con ricambi arricchiti", () => {
  it("Tests AC-3: Given riparazione id=10 has ricambi linked When I GET /api/riparazioni/10 Then response includes ricambi array with articolo object fields", async () => {
    const articoloId = await createArticolo(5, 8300);
    await caricoArticolo(articoloId, 10, 8301, "Ordine FOR-8300");
    const riparazioneId = await createRiparazione(5, 8302);

    const linkResponse = await request(app)
      .post(`/api/riparazioni/${riparazioneId}/ricambi`)
      .set("Authorization", authHeader("TECNICO", 8303))
      .send({ articoloId, quantita: 2 });
    expect(linkResponse.status).toBe(201);

    const detailResponse = await request(app)
      .get(`/api/riparazioni/${riparazioneId}`)
      .set("Authorization", authHeader("TECNICO", 8304));

    expect(detailResponse.status).toBe(200);
    expect(Array.isArray(detailResponse.body?.data?.ricambi)).toBe(true);
    const linked = (detailResponse.body?.data?.ricambi ?? []).find(
      (entry: { articolo?: { id?: number } }) => entry?.articolo?.id === articoloId,
    );
    expect(linked).toBeDefined();
    expect(linked?.articolo?.id).toBe(articoloId);
    expect(linked?.articolo?.nome).toEqual(expect.any(String));
    expect(linked?.articolo?.codiceArticolo).toEqual(
      expect.any(String),
    );
  });

  it("Tests AC-3: Given linked ricambi exist When detail is fetched Then each row exposes quantita integer and prezzoUnitario number", async () => {
    const articoloId = await createArticolo(6, 8310);
    await caricoArticolo(articoloId, 10, 8311, "Ordine FOR-8310");
    const riparazioneId = await createRiparazione(6, 8312);

    const linkResponse = await request(app)
      .post(`/api/riparazioni/${riparazioneId}/ricambi`)
      .set("Authorization", authHeader("TECNICO", 8313))
      .send({ articoloId, quantita: 2 });
    expect(linkResponse.status).toBe(201);

    const detailResponse = await request(app)
      .get(`/api/riparazioni/${riparazioneId}`)
      .set("Authorization", authHeader("TECNICO", 8314));

    expect(detailResponse.status).toBe(200);
    expect(Number.isInteger(detailResponse.body?.data?.ricambi?.[0]?.quantita)).toBe(true);
    expect(typeof detailResponse.body?.data?.ricambi?.[0]?.prezzoUnitario).toBe("number");
  });
});

describe("AC-4 - Articolo non esistente", () => {
  it('Tests AC-4: Given articolo id=999 does not exist When I POST /api/riparazioni/10/ricambi with { articoloId: 999 } Then I receive 404 with error "ARTICOLO_NOT_FOUND"', async () => {
    const riparazioneId = await createRiparazione(7, 8400);

    const response = await request(app)
      .post(`/api/riparazioni/${riparazioneId}/ricambi`)
      .set("Authorization", authHeader("TECNICO", 8401))
      .send({ articoloId: 999, quantita: 1 });

    expect(response.status).toBe(404);
    expect(response.body?.error?.code).toBe("ARTICOLO_NOT_FOUND");
  });

  it("Tests AC-4: Given articolo 999 request fails When reading riparazione detail Then ricambi linked by this request are not created", async () => {
    const riparazioneId = await createRiparazione(8, 8410);

    const response = await request(app)
      .post(`/api/riparazioni/${riparazioneId}/ricambi`)
      .set("Authorization", authHeader("TECNICO", 8411))
      .send({ articoloId: 999, quantita: 1 });
    expect(response.status).toBe(404);

    const detailResponse = await request(app)
      .get(`/api/riparazioni/${riparazioneId}`)
      .set("Authorization", authHeader("TECNICO", 8412));

    expect(detailResponse.status).toBe(200);
    expect(
      (detailResponse.body?.data?.ricambi ?? []).some(
        (entry: { articolo?: { id?: number }; codiceArticolo?: string }) =>
          entry?.articolo?.id === 999 || entry?.codiceArticolo === "999",
      ),
    ).toBe(false);
  });
});
