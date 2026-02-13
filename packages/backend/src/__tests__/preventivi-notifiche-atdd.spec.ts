import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import { resetNotificheStoreForTests } from "../services/notifiche-service.js";
import {
  resetPreventiviStoreForTests,
  setPreventivoEmailFailureForTests,
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

function authHeader(role: Role, userId = 7801): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-13T11:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  resetPreventiviStoreForTests();
  resetNotificheStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - POST /api/preventivi/5/invia creates PREVENTIVO notification with PDF attachment", () => {
  it('Tests AC-1: Given preventivo id=5 and cliente@test.it When POST /api/preventivi/5/invia Then 200 and GET /api/notifiche?tipo=PREVENTIVO returns INVIATA record', async () => {
    const sendResponse = await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7801));

    expect(sendResponse.status).toBe(200);
    expect(sendResponse.body?.id).toBe(5);
    expect(sendResponse.body?.stato).toBe("INVIATO");

    const notificheResponse = await request(app)
      .get("/api/notifiche?tipo=PREVENTIVO")
      .set("Authorization", authHeader("ADMIN", 7802));

    expect(notificheResponse.status).toBe(200);
    expect(Array.isArray(notificheResponse.body?.data)).toBe(true);
    const latest = (notificheResponse.body?.data ?? []).at(-1);
    expect(latest?.tipo).toBe("PREVENTIVO");
    expect(latest?.stato).toBe("INVIATA");
    expect(latest?.destinatario).toBe("cliente@test.it");
  });

  it('Tests AC-1: Given successful send When listing PREVENTIVO notifications Then record contains subject "Preventivo - RIP-20260209-0001" and allegato preventivo-5.pdf', async () => {
    await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7803));

    const notificheResponse = await request(app)
      .get("/api/notifiche?tipo=PREVENTIVO")
      .set("Authorization", authHeader("ADMIN", 7804));

    const latest = (notificheResponse.body?.data ?? []).at(-1);
    expect(latest?.oggetto).toBe("Preventivo - RIP-20260209-0001");
    expect(String(latest?.allegato ?? "")).toContain("preventivo-5.pdf");
  });
});

describe("AC-2 - Email body contains preventivo details (voci, subtotale, IVA, totale)", () => {
  it("Tests AC-2: Given preventivo totale 244.00 EUR When send succeeds Then notification body contains subtotale=200.00, IVA=44.00, totale=244.00", async () => {
    await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7811));

    const notificheResponse = await request(app)
      .get("/api/notifiche?tipo=PREVENTIVO")
      .set("Authorization", authHeader("ADMIN", 7812));

    const latest = (notificheResponse.body?.data ?? []).at(-1);
    const body = String(latest?.contenuto ?? "");
    expect(body).toContain("subtotale");
    expect(body).toContain("200.00");
    expect(body).toContain("IVA");
    expect(body).toContain("44.00");
    expect(body).toContain("totale");
    expect(body).toContain("244.00");
  });

  it("Tests AC-2: Given successful send When reading PREVENTIVO notification Then body contains preventivo voci details", async () => {
    await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7813));

    const notificheResponse = await request(app)
      .get("/api/notifiche?tipo=PREVENTIVO")
      .set("Authorization", authHeader("ADMIN", 7814));

    const latest = (notificheResponse.body?.data ?? []).at(-1);
    expect(String(latest?.contenuto ?? "")).toContain("voci");
  });
});

describe("AC-3 - Email failure creates PREVENTIVO FALLITA notification and returns 500", () => {
  it('Tests AC-3: Given email service fails When POST /api/preventivi/5/invia Then 500 "Failed to send email" and PREVENTIVO FALLITA notification exists', async () => {
    setPreventivoEmailFailureForTests(5, true);

    const sendResponse = await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7821));

    expect(sendResponse.status).toBe(500);
    expect(sendResponse.body?.error?.code).toBe("EMAIL_SEND_FAILED");
    expect(sendResponse.body?.error?.message).toBe("Failed to send email");

    const notificheResponse = await request(app)
      .get("/api/notifiche?stato=FALLITA&tipo=PREVENTIVO")
      .set("Authorization", authHeader("ADMIN", 7822));

    const latest = (notificheResponse.body?.data ?? []).at(-1);
    expect(latest?.tipo).toBe("PREVENTIVO");
    expect(latest?.stato).toBe("FALLITA");
  });

  it("Tests AC-3: Given failed send When reading preventivo detail Then preventivo remains BOZZA and dataInvio is null", async () => {
    setPreventivoEmailFailureForTests(5, true);
    await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7823));

    const detailResponse = await request(app)
      .get("/api/preventivi/5")
      .set("Authorization", authHeader("COMMERCIALE", 7823));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("BOZZA");
    expect(detailResponse.body?.data?.dataInvio).toBeNull();
  });
});

describe("AC-4 - GET /api/notifiche?tipo=PREVENTIVO exposes destinatario, dataInvio, stato", () => {
  it("Tests AC-4: Given preventivo sent successfully When GET /api/notifiche?tipo=PREVENTIVO Then response contains only PREVENTIVO notifications", async () => {
    await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7831));

    const response = await request(app)
      .get("/api/notifiche?tipo=PREVENTIVO")
      .set("Authorization", authHeader("ADMIN", 7832));

    expect(response.status).toBe(200);
    const rows = response.body?.data ?? [];
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row: { tipo?: string }) => row.tipo === "PREVENTIVO")).toBe(
      true,
    );
  });

  it("Tests AC-4: Given PREVENTIVO notifications exist When listing them Then each row exposes destinatario, dataInvio, stato", async () => {
    await request(app)
      .post("/api/preventivi/5/invia")
      .set("Authorization", authHeader("COMMERCIALE", 7833));

    const response = await request(app)
      .get("/api/notifiche?tipo=PREVENTIVO")
      .set("Authorization", authHeader("ADMIN", 7834));

    const latest = (response.body?.data ?? []).at(-1);
    expect(typeof latest?.destinatario).toBe("string");
    expect(latest?.destinatario).toBe("cliente@test.it");
    expect(typeof latest?.dataInvio).toBe("string");
    expect(latest?.stato).toBe("INVIATA");
  });
});
