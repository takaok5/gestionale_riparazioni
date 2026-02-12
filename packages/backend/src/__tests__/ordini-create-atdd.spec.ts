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

function authHeader(role: Role, userId = 1000): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildOrdinePayload(overrides?: Partial<Record<string, unknown>>) {
  return {
    fornitoreId: 3,
    voci: [
      { articoloId: 5, quantitaOrdinata: 10, prezzoUnitario: 100.0 },
      { articoloId: 7, quantitaOrdinata: 5, prezzoUnitario: 80.0 },
    ],
    ...overrides,
  };
}

async function createArticoloSeed(
  index: number,
  userId: number,
): Promise<number> {
  const response = await request(app)
    .post("/api/articoli")
    .set("Authorization", authHeader("ADMIN", userId))
    .send({
      codiceArticolo: `ORD-SEED-${String(index).padStart(4, "0")}`,
      nome: `Articolo ordine ${index}`,
      descrizione: `Seed articolo ${index}`,
      categoria: "RICAMBI",
      fornitoreId: 3,
      prezzoAcquisto: 50,
      prezzoVendita: 80,
      sogliaMinima: 1,
    });

  expect(response.status).toBe(201);
  return response.body.id as number;
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Creazione ordine in BOZZA con totale calcolato e numero auto-generato", () => {
  it("Tests AC-1: Given ADMIN and valid supplier/items When POST /api/ordini Then 201 and BOZZA order with totale 1400.00", async () => {
    const articoloUno = await createArticoloSeed(1, 5490);
    const articoloDue = await createArticoloSeed(2, 5491);
    const response = await request(app)
      .post("/api/ordini")
      .set("Authorization", authHeader("ADMIN", 5501))
      .send(
        buildOrdinePayload({
          voci: [
            { articoloId: articoloUno, quantitaOrdinata: 10, prezzoUnitario: 100.0 },
            { articoloId: articoloDue, quantitaOrdinata: 5, prezzoUnitario: 80.0 },
          ],
        }),
      );

    expect(response.status).toBe(201);
    expect(response.body.stato).toBe("BOZZA");
    expect(response.body.totale).toBe(1400);
  });

  it("Tests AC-1: Given successful create When checking response Then numeroOrdine matches ^ORD-[0-9]{6}$ and fornitoreId is 3", async () => {
    const articoloUno = await createArticoloSeed(3, 5492);
    const articoloDue = await createArticoloSeed(4, 5493);
    const response = await request(app)
      .post("/api/ordini")
      .set("Authorization", authHeader("ADMIN", 5502))
      .send(
        buildOrdinePayload({
          voci: [
            { articoloId: articoloUno, quantitaOrdinata: 10, prezzoUnitario: 100.0 },
            { articoloId: articoloDue, quantitaOrdinata: 5, prezzoUnitario: 80.0 },
          ],
        }),
      );

    expect(response.status).toBe(201);
    expect(response.body.numeroOrdine).toMatch(/^ORD-[0-9]{6}$/);
    expect(response.body.fornitoreId).toBe(3);
  });
});

describe("AC-2 - Fornitore non trovato", () => {
  it("Tests AC-2: Given ADMIN and fornitoreId=999 When POST /api/ordini Then 404 FORNITORE_NOT_FOUND", async () => {
    const response = await request(app)
      .post("/api/ordini")
      .set("Authorization", authHeader("ADMIN", 5510))
      .send(
        buildOrdinePayload({
          fornitoreId: 999,
          voci: [{ articoloId: 5, quantitaOrdinata: 1, prezzoUnitario: 100.0 }],
        }),
      );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("FORNITORE_NOT_FOUND");
  });

  it("Tests AC-2: Given missing supplier When creation fails Then body does not expose order id", async () => {
    const response = await request(app)
      .post("/api/ordini")
      .set("Authorization", authHeader("ADMIN", 5511))
      .send(
        buildOrdinePayload({
          fornitoreId: 999,
          voci: [{ articoloId: 5, quantitaOrdinata: 1, prezzoUnitario: 100.0 }],
        }),
      );

    expect(response.status).toBe(404);
    expect(response.body.id).toBeUndefined();
  });
});

describe("AC-3 - Articolo non trovato in una voce ordine", () => {
  it('Tests AC-3: Given ADMIN and voce articoloId=999 When POST /api/ordini Then 404 ARTICOLO_NOT_FOUND with message "ARTICOLO_NOT_FOUND in voce"', async () => {
    const response = await request(app)
      .post("/api/ordini")
      .set("Authorization", authHeader("ADMIN", 5520))
      .send({
        fornitoreId: 3,
        voci: [{ articoloId: 999, quantitaOrdinata: 2, prezzoUnitario: 50.0 }],
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ARTICOLO_NOT_FOUND");
    expect(response.body.error.message).toBe("ARTICOLO_NOT_FOUND in voce");
  });

  it("Tests AC-3: Given invalid articolo in voce When request fails Then response does not include numeroOrdine", async () => {
    const response = await request(app)
      .post("/api/ordini")
      .set("Authorization", authHeader("ADMIN", 5521))
      .send({
        fornitoreId: 3,
        voci: [{ articoloId: 999, quantitaOrdinata: 2, prezzoUnitario: 50.0 }],
      });

    expect(response.status).toBe(404);
    expect(response.body.numeroOrdine).toBeUndefined();
  });
});

describe("AC-4 - Accesso negato a utente non Admin", () => {
  it("Tests AC-4: Given TECNICO When POST /api/ordini with valid payload Then 403 FORBIDDEN", async () => {
    const response = await request(app)
      .post("/api/ordini")
      .set("Authorization", authHeader("TECNICO", 5530))
      .send({
        fornitoreId: 3,
        voci: [{ articoloId: 5, quantitaOrdinata: 1, prezzoUnitario: 100.0 }],
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("Tests AC-4: Given forbidden technical user When checking payload Then message is Accesso negato", async () => {
    const response = await request(app)
      .post("/api/ordini")
      .set("Authorization", authHeader("TECNICO", 5531))
      .send({
        fornitoreId: 3,
        voci: [{ articoloId: 5, quantitaOrdinata: 1, prezzoUnitario: 100.0 }],
      });

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe("Accesso negato");
  });
});
