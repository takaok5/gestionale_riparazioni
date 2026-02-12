import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
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

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-12T10:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  resetPreventiviStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Modifica bozza con replace voci e ricalcolo totali", () => {
  it('Tests AC-1: Given preventivo id=5 in BOZZA When PUT /api/preventivi/5 con una voce MANODOPERA 2x90 Then HTTP 200 con subtotale=180.00 iva=39.60 totale=219.60', async () => {
    const response = await request(app)
      .put("/api/preventivi/5")
      .set("Authorization", authHeader("TECNICO", 5201))
      .send({
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Riparazione aggiornata",
            quantita: 2,
            prezzoUnitario: 90.0,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body?.subtotale).toBe(180);
    expect(response.body?.iva).toBe(39.6);
    expect(response.body?.totale).toBe(219.6);
    expect(response.body?.stato).toBe("BOZZA");
  });

  it("Tests AC-1: Given preventivo id=5 in BOZZA When update replace voci Then risposta contiene una sola voce con descrizione aggiornata", async () => {
    const response = await request(app)
      .put("/api/preventivi/5")
      .set("Authorization", authHeader("TECNICO", 5202))
      .send({
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Riparazione aggiornata",
            quantita: 2,
            prezzoUnitario: 90.0,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.voci)).toBe(true);
    expect(response.body?.voci).toHaveLength(1);
    expect(response.body?.voci?.[0]?.descrizione).toBe("Riparazione aggiornata");
  });
});

describe("AC-2 - Modifica bozza con aggiunta voce", () => {
  it("Tests AC-2: Given preventivo id=5 in BOZZA When PUT con due voci Then HTTP 200 e voci.length=2 con totali 140/30.80/170.80", async () => {
    const response = await request(app)
      .put("/api/preventivi/5")
      .set("Authorization", authHeader("TECNICO", 5301))
      .send({
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Diagnosi iniziale",
            quantita: 1,
            prezzoUnitario: 50.0,
          },
          {
            tipo: "RICAMBIO",
            descrizione: "Batteria",
            articoloId: 8,
            quantita: 1,
            prezzoUnitario: 90.0,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body?.voci).toHaveLength(2);
    expect(response.body?.subtotale).toBe(140);
    expect(response.body?.iva).toBe(30.8);
    expect(response.body?.totale).toBe(170.8);
    expect(response.body?.stato).toBe("BOZZA");
  });

  it("Tests AC-2: Given payload include nuova voce RICAMBIO Batteria When update succeed Then seconda voce mantiene articoloId=8 e prezzoUnitario=90", async () => {
    const response = await request(app)
      .put("/api/preventivi/5")
      .set("Authorization", authHeader("TECNICO", 5302))
      .send({
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Diagnosi iniziale",
            quantita: 1,
            prezzoUnitario: 50.0,
          },
          {
            tipo: "RICAMBIO",
            descrizione: "Batteria",
            articoloId: 8,
            quantita: 1,
            prezzoUnitario: 90.0,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body?.voci?.[1]?.tipo).toBe("RICAMBIO");
    expect(response.body?.voci?.[1]?.articoloId).toBe(8);
    expect(response.body?.voci?.[1]?.prezzoUnitario).toBe(90);
  });
});

describe("AC-3 - Blocco modifica preventivo INVIATO", () => {
  it('Tests AC-3: Given preventivo id=5 in stato INVIATO When PUT /api/preventivi/5 Then HTTP 400 con messaggio "Cannot edit preventivo with stato INVIATO"', async () => {
    setPreventivoStatoForTests(5, "INVIATO");

    const response = await request(app)
      .put("/api/preventivi/5")
      .set("Authorization", authHeader("TECNICO", 5401))
      .send({
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Tentativo modifica inviato",
            quantita: 1,
            prezzoUnitario: 70.0,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe(
      "Cannot edit preventivo with stato INVIATO",
    );
  });

  it("Tests AC-3: Given stato INVIATO non editabile When PUT Then risposta include error.code VALIDATION_ERROR", async () => {
    setPreventivoStatoForTests(5, "INVIATO");

    const response = await request(app)
      .put("/api/preventivi/5")
      .set("Authorization", authHeader("TECNICO", 5402))
      .send({
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Tentativo modifica inviato",
            quantita: 1,
            prezzoUnitario: 70.0,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });
});

describe("AC-4 - Blocco modifica preventivo APPROVATO", () => {
  it('Tests AC-4: Given preventivo id=5 in stato APPROVATO When PUT /api/preventivi/5 Then HTTP 400 con messaggio "Cannot edit preventivo with stato APPROVATO"', async () => {
    setPreventivoStatoForTests(5, "APPROVATO");

    const response = await request(app)
      .put("/api/preventivi/5")
      .set("Authorization", authHeader("TECNICO", 5501))
      .send({
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Tentativo modifica approvato",
            quantita: 1,
            prezzoUnitario: 70.0,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe(
      "Cannot edit preventivo with stato APPROVATO",
    );
  });

  it("Tests AC-4: Given stato APPROVATO non editabile When PUT Then risposta include error.code VALIDATION_ERROR", async () => {
    setPreventivoStatoForTests(5, "APPROVATO");

    const response = await request(app)
      .put("/api/preventivi/5")
      .set("Authorization", authHeader("TECNICO", 5502))
      .send({
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Tentativo modifica approvato",
            quantita: 1,
            prezzoUnitario: 70.0,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });
});

describe("Regressione - PUT preventivo inesistente", () => {
  it("Given preventivo id=999 inesistente When PUT /api/preventivi/999 Then HTTP 404 con PREVENTIVO_NOT_FOUND", async () => {
    const response = await request(app)
      .put("/api/preventivi/999")
      .set("Authorization", authHeader("TECNICO", 5601))
      .send({
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Tentativo su id inesistente",
            quantita: 1,
            prezzoUnitario: 10.0,
          },
        ],
      });

    expect(response.status).toBe(404);
    expect(response.body?.error?.code).toBe("PREVENTIVO_NOT_FOUND");
  });

  it("Given preventivo id=999 inesistente When PUT Then payload non espone campi preventivo", async () => {
    const response = await request(app)
      .put("/api/preventivi/999")
      .set("Authorization", authHeader("TECNICO", 5602))
      .send({
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Tentativo su id inesistente",
            quantita: 1,
            prezzoUnitario: 10.0,
          },
        ],
      });

    expect(response.status).toBe(404);
    expect(response.body?.id).toBeUndefined();
    expect(response.body?.totale).toBeUndefined();
  });
});
