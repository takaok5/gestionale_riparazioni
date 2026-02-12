import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
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

async function createArticoloSeed(index: number, userId: number): Promise<number> {
  const response = await request(app)
    .post("/api/articoli")
    .set("Authorization", authHeader("ADMIN", userId))
    .send({
      codiceArticolo: `ORD-STATO-${String(index).padStart(4, "0")}`,
      nome: `Articolo stato ordine ${index}`,
      descrizione: `Seed articolo stato ordine ${index}`,
      categoria: "RICAMBI",
      fornitoreId: 3,
      prezzoAcquisto: 50,
      prezzoVendita: 80,
      sogliaMinima: 1,
    });

  expect(response.status).toBe(201);
  return response.body.id as number;
}

async function createOrdineBozza(adminUserId: number): Promise<number> {
  const articoloUno = await createArticoloSeed(adminUserId, adminUserId);
  const articoloDue = await createArticoloSeed(adminUserId + 100, adminUserId + 100);
  const response = await request(app)
    .post("/api/ordini")
    .set("Authorization", authHeader("ADMIN", adminUserId))
    .send({
      fornitoreId: 3,
      voci: [
        { articoloId: articoloUno, quantitaOrdinata: 10, prezzoUnitario: 100.0 },
        { articoloId: articoloDue, quantitaOrdinata: 5, prezzoUnitario: 80.0 },
      ],
    });

  expect(response.status).toBe(201);
  expect(response.body.stato).toBe("BOZZA");
  return response.body.id as number;
}

async function patchStato(
  ordineId: number,
  stato: string,
  role: Role,
  userId: number,
) {
  return request(app)
    .patch(`/api/ordini/${ordineId}/stato`)
    .set("Authorization", authHeader(role, userId))
    .send({ stato });
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - BOZZA -> EMESSO imposta dataEmissione", () => {
  it('Tests AC-1: Given utente ADMIN e ordine 12 in BOZZA con dataEmissione null When PATCH /api/ordini/12/stato {"stato":"EMESSO"} Then HTTP 200 con stato EMESSO e dataEmissione valorizzata', async () => {
    const ordineId = await createOrdineBozza(7101);
    const response = await patchStato(ordineId, "EMESSO", "ADMIN", 7102);

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("EMESSO");
    expect(response.body?.data?.dataEmissione).toEqual(expect.any(String));
  });

  it("Tests AC-1: Given ordine in BOZZA When patch to EMESSO Then detail payload includes ordine id and unchanged fornitoreId", async () => {
    const ordineId = await createOrdineBozza(7103);
    const response = await patchStato(ordineId, "EMESSO", "ADMIN", 7104);

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(ordineId);
    expect(response.body?.data?.fornitoreId).toBe(3);
  });
});

describe("AC-2 - EMESSO -> CONFERMATO", () => {
  it('Tests AC-2: Given ordine in EMESSO When PATCH /api/ordini/:id/stato {"stato":"CONFERMATO"} Then HTTP 200 with stato CONFERMATO', async () => {
    const ordineId = await createOrdineBozza(7201);
    await patchStato(ordineId, "EMESSO", "ADMIN", 7202);
    const response = await patchStato(ordineId, "CONFERMATO", "ADMIN", 7203);

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("CONFERMATO");
  });

  it("Tests AC-2: Given confirmed transition succeeds When reading response Then transition does not clear dataEmissione", async () => {
    const ordineId = await createOrdineBozza(7204);
    await patchStato(ordineId, "EMESSO", "ADMIN", 7205);
    const response = await patchStato(ordineId, "CONFERMATO", "ADMIN", 7206);

    expect(response.status).toBe(200);
    expect(response.body?.data?.dataEmissione).toEqual(expect.any(String));
  });
});

describe("AC-3 - CONFERMATO -> SPEDITO", () => {
  it('Tests AC-3: Given ordine in CONFERMATO When PATCH /api/ordini/:id/stato {"stato":"SPEDITO"} Then HTTP 200 with stato SPEDITO', async () => {
    const ordineId = await createOrdineBozza(7301);
    await patchStato(ordineId, "EMESSO", "ADMIN", 7302);
    await patchStato(ordineId, "CONFERMATO", "ADMIN", 7303);
    const response = await patchStato(ordineId, "SPEDITO", "ADMIN", 7304);

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("SPEDITO");
  });

  it("Tests AC-3: Given transition to SPEDITO When response is returned Then id is preserved", async () => {
    const ordineId = await createOrdineBozza(7305);
    await patchStato(ordineId, "EMESSO", "ADMIN", 7306);
    await patchStato(ordineId, "CONFERMATO", "ADMIN", 7307);
    const response = await patchStato(ordineId, "SPEDITO", "ADMIN", 7308);

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(ordineId);
  });
});

describe("AC-4 - SPEDITO -> RICEVUTO imposta dataRicezione", () => {
  it('Tests AC-4: Given ordine in SPEDITO con dataRicezione null When PATCH /api/ordini/:id/stato {"stato":"RICEVUTO"} Then HTTP 200, stato RICEVUTO e dataRicezione valorizzata', async () => {
    const ordineId = await createOrdineBozza(7401);
    await patchStato(ordineId, "EMESSO", "ADMIN", 7402);
    await patchStato(ordineId, "CONFERMATO", "ADMIN", 7403);
    await patchStato(ordineId, "SPEDITO", "ADMIN", 7404);
    const response = await patchStato(ordineId, "RICEVUTO", "ADMIN", 7405);

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("RICEVUTO");
    expect(response.body?.data?.dataRicezione).toEqual(expect.any(String));
  });

  it("Tests AC-4: Given order receives final transition When response returned Then dataEmissione remains available", async () => {
    const ordineId = await createOrdineBozza(7406);
    await patchStato(ordineId, "EMESSO", "ADMIN", 7407);
    await patchStato(ordineId, "CONFERMATO", "ADMIN", 7408);
    await patchStato(ordineId, "SPEDITO", "ADMIN", 7409);
    const response = await patchStato(ordineId, "RICEVUTO", "ADMIN", 7410);

    expect(response.status).toBe(200);
    expect(response.body?.data?.dataEmissione).toEqual(expect.any(String));
  });
});

describe("AC-5 - BOZZA -> ANNULLATO", () => {
  it('Tests AC-5: Given ordine BOZZA When PATCH /api/ordini/:id/stato {"stato":"ANNULLATO"} Then HTTP 200 and stato ANNULLATO', async () => {
    const ordineId = await createOrdineBozza(7501);
    const response = await patchStato(ordineId, "ANNULLATO", "ADMIN", 7502);

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("ANNULLATO");
  });

  it("Tests AC-5: Given cancel from BOZZA succeeds When inspecting payload Then order id is returned", async () => {
    const ordineId = await createOrdineBozza(7503);
    const response = await patchStato(ordineId, "ANNULLATO", "ADMIN", 7504);

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(ordineId);
  });
});

describe("AC-6 - Override Admin: CONFERMATO -> ANNULLATO", () => {
  it('Tests AC-6: Given ordine CONFERMATO e actor ADMIN When PATCH /api/ordini/:id/stato {"stato":"ANNULLATO"} Then HTTP 200 and stato ANNULLATO', async () => {
    const ordineId = await createOrdineBozza(7601);
    await patchStato(ordineId, "EMESSO", "ADMIN", 7602);
    await patchStato(ordineId, "CONFERMATO", "ADMIN", 7603);
    const response = await patchStato(ordineId, "ANNULLATO", "ADMIN", 7604);

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("ANNULLATO");
  });

  it("Tests AC-6: Given admin override succeeds When payload checked Then numeroOrdine remains present", async () => {
    const ordineId = await createOrdineBozza(7605);
    await patchStato(ordineId, "EMESSO", "ADMIN", 7606);
    await patchStato(ordineId, "CONFERMATO", "ADMIN", 7607);
    const response = await patchStato(ordineId, "ANNULLATO", "ADMIN", 7608);

    expect(response.status).toBe(200);
    expect(response.body?.data?.numeroOrdine).toMatch(/^ORD-[0-9]{6}$/);
  });
});

describe("AC-7 - Blocco annullamento da SPEDITO per non Admin", () => {
  it('Tests AC-7: Given actor COMMERCIALE e ordine SPEDITO When PATCH /api/ordini/:id/stato {"stato":"ANNULLATO"} Then HTTP 400 VALIDATION_ERROR con messaggio esatto', async () => {
    const ordineId = await createOrdineBozza(7701);
    await patchStato(ordineId, "EMESSO", "ADMIN", 7702);
    await patchStato(ordineId, "CONFERMATO", "ADMIN", 7703);
    await patchStato(ordineId, "SPEDITO", "ADMIN", 7704);
    const response = await patchStato(ordineId, "ANNULLATO", "COMMERCIALE", 7705);

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
    expect(response.body?.error?.message).toBe("Cannot cancel order in SPEDITO state");
  });

  it("Tests AC-7: Given failed cancel from SPEDITO by non-admin When reading detail Then stato remains SPEDITO", async () => {
    const ordineId = await createOrdineBozza(7706);
    await patchStato(ordineId, "EMESSO", "ADMIN", 7707);
    await patchStato(ordineId, "CONFERMATO", "ADMIN", 7708);
    await patchStato(ordineId, "SPEDITO", "ADMIN", 7709);
    const forbidden = await patchStato(ordineId, "ANNULLATO", "COMMERCIALE", 7710);
    const response = await patchStato(ordineId, "RICEVUTO", "ADMIN", 7711);

    expect(forbidden.status).toBe(400);
    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("RICEVUTO");
  });

  it('Hardening: Given actor COMMERCIALE and ordine BOZZA When PATCH /api/ordini/:id/stato {"stato":"EMESSO"} Then HTTP 400 with message "Only ADMIN can update order status"', async () => {
    const ordineId = await createOrdineBozza(7712);
    const response = await patchStato(ordineId, "EMESSO", "COMMERCIALE", 7713);

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
    expect(response.body?.error?.message).toBe("Only ADMIN can update order status");
  });
});
