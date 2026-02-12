import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

function authHeader(role: Role, userId = 7601): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-12T11:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  resetPreventiviStoreForTests();
});

describe("AC-1 - Approvazione preventivo in stato INVIATO", () => {
  it('Tests AC-1: Given preventivo id=5 in stato INVIATO e riparazione id=10 in stato IN_ATTESA_APPROVAZIONE When PATCH /api/preventivi/5/risposta con { approvato: true } Then HTTP 200 con data.id=5, data.stato=APPROVATO e data.riparazioneStato=APPROVATA', async () => {
    setPreventivoStatoForTests(5, "INVIATO");

    const response = await request(app)
      .patch("/api/preventivi/5/risposta")
      .set("Authorization", authHeader("COMMERCIALE", 7611))
      .send({ approvato: true });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(5);
    expect(response.body?.data?.stato).toBe("APPROVATO");
    expect(response.body?.data?.riparazioneStato).toBe("APPROVATA");
  });

  it('Tests AC-1: Given preventivo id=5 in stato INVIATO When PATCH /api/preventivi/5/risposta con { approvato: true } Then dataRisposta e\' timestamp ISO non nullo', async () => {
    setPreventivoStatoForTests(5, "INVIATO");

    const response = await request(app)
      .patch("/api/preventivi/5/risposta")
      .set("Authorization", authHeader("COMMERCIALE", 7612))
      .send({ approvato: true });

    expect(response.status).toBe(200);
    expect(typeof response.body?.data?.dataRisposta).toBe("string");
    expect(Number.isNaN(Date.parse(response.body?.data?.dataRisposta))).toBe(
      false,
    );
  });
});

describe("AC-2 - Rifiuto preventivo in stato INVIATO", () => {
  it('Tests AC-2: Given preventivo id=5 in stato INVIATO e riparazione id=10 in stato IN_ATTESA_APPROVAZIONE When PATCH /api/preventivi/5/risposta con { approvato: false } Then HTTP 200 con data.id=5, data.stato=RIFIUTATO e data.riparazioneStato=ANNULLATA', async () => {
    setPreventivoStatoForTests(5, "INVIATO");

    const response = await request(app)
      .patch("/api/preventivi/5/risposta")
      .set("Authorization", authHeader("COMMERCIALE", 7621))
      .send({ approvato: false });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(5);
    expect(response.body?.data?.stato).toBe("RIFIUTATO");
    expect(response.body?.data?.riparazioneStato).toBe("ANNULLATA");
  });

  it('Tests AC-2: Given preventivo id=5 in stato INVIATO When PATCH /api/preventivi/5/risposta con { approvato: false } Then dataRisposta e\' timestamp ISO non nullo', async () => {
    setPreventivoStatoForTests(5, "INVIATO");

    const response = await request(app)
      .patch("/api/preventivi/5/risposta")
      .set("Authorization", authHeader("COMMERCIALE", 7622))
      .send({ approvato: false });

    expect(response.status).toBe(200);
    expect(typeof response.body?.data?.dataRisposta).toBe("string");
    expect(Number.isNaN(Date.parse(response.body?.data?.dataRisposta))).toBe(
      false,
    );
  });
});

describe("AC-3 - Blocco risposta se stato preventivo non INVIATO", () => {
  it('Tests AC-3: Given preventivo id=5 in stato BOZZA When PATCH /api/preventivi/5/risposta con { approvato: true } Then HTTP 400 con errore \"Preventivo must be in INVIATO state to record response\"', async () => {
    const response = await request(app)
      .patch("/api/preventivi/5/risposta")
      .set("Authorization", authHeader("COMMERCIALE", 7631))
      .send({ approvato: true });

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe(
      "Preventivo must be in INVIATO state to record response",
    );
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it('Tests AC-3: Given preventivo id=5 in stato BOZZA When PATCH /api/preventivi/5/risposta con { approvato: false } Then HTTP 400 con lo stesso errore e preventivo resta BOZZA', async () => {
    const response = await request(app)
      .patch("/api/preventivi/5/risposta")
      .set("Authorization", authHeader("COMMERCIALE", 7632))
      .send({ approvato: false });

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe(
      "Preventivo must be in INVIATO state to record response",
    );

    const detail = await request(app)
      .get("/api/preventivi/5")
      .set("Authorization", authHeader("COMMERCIALE", 7632));

    expect(detail.status).toBe(200);
    expect(detail.body?.data?.stato).toBe("BOZZA");
  });
});

describe("AC-4 - Blocco risposta gia' registrata", () => {
  it('Tests AC-4: Given preventivo id=5 gia\' APPROVATO con dataRisposta valorizzato When PATCH /api/preventivi/5/risposta con { approvato: true } Then HTTP 400 con errore \"Response already recorded for this preventivo\"', async () => {
    setPreventivoStatoForTests(5, "APPROVATO");

    const response = await request(app)
      .patch("/api/preventivi/5/risposta")
      .set("Authorization", authHeader("COMMERCIALE", 7641))
      .send({ approvato: true });

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe(
      "Response already recorded for this preventivo",
    );
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("Tests AC-4: Given preventivo id=5 gia' APPROVATO When PATCH /api/preventivi/5/risposta con { approvato: false } Then HTTP 400 e stato preventivo resta APPROVATO", async () => {
    setPreventivoStatoForTests(5, "APPROVATO");

    const response = await request(app)
      .patch("/api/preventivi/5/risposta")
      .set("Authorization", authHeader("COMMERCIALE", 7642))
      .send({ approvato: false });

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe(
      "Response already recorded for this preventivo",
    );

    const detail = await request(app)
      .get("/api/preventivi/5")
      .set("Authorization", authHeader("COMMERCIALE", 7642));

    expect(detail.status).toBe(200);
    expect(detail.body?.data?.stato).toBe("APPROVATO");
  });
});
