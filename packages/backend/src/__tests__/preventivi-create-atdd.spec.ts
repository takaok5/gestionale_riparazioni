import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import { resetPreventiviStoreForTests } from "../services/preventivi-service.js";
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

function authHeader(role: Role, userId = 4100): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildRiparazionePayload(index: number): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: "Samsung",
    modelloDispositivo: `Galaxy-S${index}`,
    serialeDispositivo: `SN-PREV-${index}`,
    descrizioneProblema: "Schermo rotto",
    accessoriConsegnati: "Caricabatterie",
    priorita: "NORMALE",
  };
}

async function seedRiparazioneId10(): Promise<void> {
  for (let index = 1; index <= 10; index += 1) {
    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 4200 + index))
      .send(buildRiparazionePayload(index));

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(index);
  }
}

function buildPreventivoPayload(overrides?: Partial<Record<string, unknown>>): Record<string, unknown> {
  return {
    riparazioneId: 10,
    voci: [
      {
        tipo: "MANODOPERA",
        descrizione: "Sostituzione schermo",
        quantita: 1,
        prezzoUnitario: 80.0,
      },
      {
        tipo: "RICAMBIO",
        descrizione: "Display LCD",
        articoloId: 5,
        quantita: 1,
        prezzoUnitario: 120.0,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-12T09:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  resetPreventiviStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Creazione preventivo con totali", () => {
  it('Tests AC-1: Given esiste una riparazione con id=10 When invio POST /api/preventivi con payload MANODOPERA+RICAMBIO Then viene creato preventivo in stato "BOZZA" con subtotale=200.00, iva=44.00, totale=244.00 e HTTP 201', async () => {
    await seedRiparazioneId10();

    const response = await request(app)
      .post("/api/preventivi")
      .set("Authorization", authHeader("TECNICO", 4301))
      .send(buildPreventivoPayload());

    expect(response.status).toBe(201);
    expect(response.body?.stato).toBe("BOZZA");
    expect(response.body?.subtotale).toBe(200);
    expect(response.body?.iva).toBe(44);
    expect(response.body?.totale).toBe(244);
  });

  it("Tests AC-1: Given payload contiene 2 voci con importi specifici When creo il preventivo Then la risposta include riparazioneId=10 e le stesse voci itemizzate", async () => {
    await seedRiparazioneId10();

    const response = await request(app)
      .post("/api/preventivi")
      .set("Authorization", authHeader("TECNICO", 4302))
      .send(buildPreventivoPayload());

    expect(response.status).toBe(201);
    expect(response.body?.riparazioneId).toBe(10);
    expect(Array.isArray(response.body?.voci)).toBe(true);
    expect(response.body?.voci).toHaveLength(2);
    expect(response.body?.voci?.[0]?.tipo).toBe("MANODOPERA");
    expect(response.body?.voci?.[1]?.tipo).toBe("RICAMBIO");
  });
});

describe("AC-3 - Riparazione inesistente in creazione preventivo", () => {
  it('Tests AC-3: Given invio POST /api/preventivi con riparazioneId=999 (inesistente) When la richiesta viene processata Then ricevo HTTP 404 con errore "RIPARAZIONE_NOT_FOUND"', async () => {
    const response = await request(app)
      .post("/api/preventivi")
      .set("Authorization", authHeader("TECNICO", 4401))
      .send(buildPreventivoPayload({ riparazioneId: 999 }));

    expect(response.status).toBe(404);
    expect(response.body?.error?.code).toBe("RIPARAZIONE_NOT_FOUND");
    expect(response.body?.error?.message).toBe("Riparazione non trovata");
  });

  it("Tests AC-3: Given riparazioneId=999 non esiste When POST /api/preventivi fallisce Then la risposta non espone id preventivo o totali", async () => {
    const response = await request(app)
      .post("/api/preventivi")
      .set("Authorization", authHeader("TECNICO", 4402))
      .send(buildPreventivoPayload({ riparazioneId: 999 }));

    expect(response.status).toBe(404);
    expect(response.body?.id).toBeUndefined();
    expect(response.body?.totale).toBeUndefined();
    expect(response.body?.subtotale).toBeUndefined();
  });
});

describe("AC-4 - Validazione voce senza descrizione", () => {
  it('Tests AC-4: Given invio POST /api/preventivi con una voce senza descrizione When la richiesta viene validata Then ricevo HTTP 400 con error.code "VALIDATION_ERROR" e messaggio "descrizione is required for each voce"', async () => {
    await seedRiparazioneId10();

    const response = await request(app)
      .post("/api/preventivi")
      .set("Authorization", authHeader("TECNICO", 4501))
      .send(
        buildPreventivoPayload({
          voci: [
            {
              tipo: "MANODOPERA",
              quantita: 1,
              prezzoUnitario: 80.0,
            },
          ],
        }),
      );

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
    expect(response.body?.error?.message).toBe("descrizione is required for each voce");
  });

  it("Tests AC-4: Given manca descrizione nella voce When validazione fallisce Then i dettagli errore puntano al campo descrizione", async () => {
    await seedRiparazioneId10();

    const response = await request(app)
      .post("/api/preventivi")
      .set("Authorization", authHeader("TECNICO", 4502))
      .send(
        buildPreventivoPayload({
          voci: [
            {
              tipo: "RICAMBIO",
              articoloId: 5,
              quantita: 1,
              prezzoUnitario: 120.0,
            },
          ],
        }),
      );

    expect(response.status).toBe(400);
    expect(response.body?.error?.details?.field).toBe("descrizione");
    expect(response.body?.error?.details?.rule).toBe("required");
  });
});
