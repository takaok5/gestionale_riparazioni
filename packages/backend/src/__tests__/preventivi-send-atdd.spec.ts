import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import {
  resetPreventiviStoreForTests,
  setPreventivoClienteEmailForTests,
  setPreventivoEmailFailureForTests,
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

function authHeader(role: Role, userId = 7001): string {
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

describe("AC-1 - Invio preventivo bozza al cliente", () => {
  it('Tests AC-1: Given preventivo id=5 in BOZZA con cliente email=cliente@test.it When POST /api/preventivi/5/invia Then HTTP 200 con stato INVIATO e dataInvio valorizzato', async () => {
    const response = await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7101));

    expect(response.status).toBe(200);
    expect(response.body?.id).toBe(5);
    expect(response.body?.stato).toBe("INVIATO");
    expect(typeof response.body?.dataInvio).toBe("string");
  });

  it('Tests AC-1: Given invio riuscito When verifico side effects Then riparazione passa a IN_ATTESA_APPROVAZIONE e risposta include id riparazione 10', async () => {
    const response = await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7102));

    expect(response.status).toBe(200);
    expect(response.body?.riparazioneId).toBe(10);
    expect(response.body?.riparazioneStato).toBe("IN_ATTESA_APPROVAZIONE");
  });
});

describe("AC-2 - Blocco reinvio preventivo gia' inviato", () => {
  it('Tests AC-2: Given preventivo id=5 in stato INVIATO When POST /api/preventivi/5/invia Then HTTP 400 con messaggio "Preventivo already sent"', async () => {
    setPreventivoStatoForTests(5, "INVIATO");

    const response = await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7201));

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe("Preventivo already sent");
  });

  it("Tests AC-2: Given stato INVIATO non reinviabile When POST /api/preventivi/5/invia Then error.code e' VALIDATION_ERROR", async () => {
    setPreventivoStatoForTests(5, "INVIATO");

    const response = await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7202));

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });
});

describe("AC-3 - Email cliente mancante", () => {
  it('Tests AC-3: Given preventivo id=5 in BOZZA con cliente email=null When POST /api/preventivi/5/invia Then HTTP 400 con messaggio "Customer email is required to send quotation"', async () => {
    setPreventivoClienteEmailForTests(5, null);

    const response = await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7301));

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe(
      "Customer email is required to send quotation",
    );
  });

  it("Tests AC-3: Given email cliente assente When invio preventivo Then error.code e' VALIDATION_ERROR", async () => {
    setPreventivoClienteEmailForTests(5, null);

    const response = await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7302));

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });
});

describe("AC-4 - Fallimento servizio email", () => {
  it('Tests AC-4: Given email service fails When POST /api/preventivi/5/invia Then HTTP 500 con messaggio "Failed to send email"', async () => {
    setPreventivoEmailFailureForTests(5, true);

    const response = await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7401));

    expect(response.status).toBe(500);
    expect(response.body?.error?.message).toBe("Failed to send email");
  });

  it('Tests AC-4: Given failure email When invio preventivo Then stato resta BOZZA e dataInvio resta null', async () => {
    setPreventivoEmailFailureForTests(5, true);

    const sendResponse = await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7402));

    expect(sendResponse.status).toBe(500);

    const detailResponse = await request(app)
      .get("/api/preventivi/5")
      .set("Authorization", authHeader("COMMERCIALE", 7402));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("BOZZA");
    expect(detailResponse.body?.data?.dataInvio).toBeNull();
  });
});
