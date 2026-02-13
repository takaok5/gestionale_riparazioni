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

function authHeader(role: Role, userId = 7900): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildRiparazionePayload(index: number): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: "Apple",
    modelloDispositivo: `iPhone-stripe-${index}`,
    serialeDispositivo: `SN-STRIPE-${index}`,
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
      .set("Authorization", authHeader("TECNICO", 8000 + index))
      .send(buildRiparazionePayload(index));

    expect(response.status).toBe(201);
  }
}

async function createApprovedPreventivo(riparazioneId: number): Promise<void> {
  const createResponse = await request(app)
    .post("/api/preventivi")
    .set("Authorization", authHeader("TECNICO", 8100 + riparazioneId))
    .send(buildPreventivoPayload(riparazioneId));

  expect(createResponse.status).toBe(201);
  const preventivoId = createResponse.body?.id as number;
  setPreventivoStatoForTests(preventivoId, "INVIATO");

  const approveResponse = await request(app)
    .patch(`/api/preventivi/${preventivoId}/risposta`)
    .set("Authorization", authHeader("COMMERCIALE", 8200 + riparazioneId))
    .send({ approvato: true });

  expect(approveResponse.status).toBe(200);
}

async function createFatturaForRiparazione(riparazioneId: number): Promise<number> {
  const response = await request(app)
    .post("/api/fatture")
    .set("Authorization", authHeader("COMMERCIALE", 8300 + riparazioneId))
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

function buildStripeCompletedEvent(): Record<string, unknown> {
  return {
    id: "evt_7_6_completed_001",
    type: "checkout.session.completed",
    created: 1739404800,
    data: {
      object: {
        id: "cs_test_link_8",
        metadata: { fatturaId: "8" },
        amount_total: 24400,
      },
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-10T09:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  resetPreventiviStoreForTests();
  resetFattureStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Link Stripe Checkout", () => {
  it("Tests AC-1: Given fattura id=8 totale 244.00 stato EMESSA When POST /api/pagamenti/crea-link/8 Then HTTP 200 con paymentUrl e sessionId", async () => {
    const fatturaId = await seedFattureUntil(8);
    expect(fatturaId).toBe(8);

    const response = await request(app)
      .post("/api/pagamenti/crea-link/8")
      .set("Authorization", authHeader("COMMERCIALE", 8401))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body?.paymentUrl).toBeDefined();
    expect(response.body?.sessionId).toBeDefined();
  });

  it("Tests AC-1: Given richiesta link Stripe valida When POST /api/pagamenti/crea-link/8 Then paymentUrl ha prefisso Stripe e sessionId segue pattern cs_", async () => {
    await seedFattureUntil(8);

    const response = await request(app)
      .post("/api/pagamenti/crea-link/8")
      .set("Authorization", authHeader("COMMERCIALE", 8402))
      .send({});

    expect(response.status).toBe(200);
    expect(String(response.body?.paymentUrl)).toContain("https://checkout.stripe.com/pay/");
    expect(String(response.body?.sessionId)).toMatch(/^cs_(test_)?[A-Za-z0-9_]+$/);
  });
});

describe("AC-2 - Fattura gia pagata", () => {
  it("Tests AC-2: Given fattura id=8 stato PAGATA When POST /api/pagamenti/crea-link/8 Then HTTP 400 con errore Invoice is already paid", async () => {
    await seedFattureUntil(8);

    const fullPayment = await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 8411))
      .send({ importo: 244.0, metodo: "CONTANTE", dataPagamento: "2026-02-10" });
    expect(fullPayment.status).toBe(201);

    const response = await request(app)
      .post("/api/pagamenti/crea-link/8")
      .set("Authorization", authHeader("COMMERCIALE", 8412))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe("Invoice is already paid");
  });

  it("Tests AC-2: Given fattura pagata When POST /api/pagamenti/crea-link/8 Then response non contiene paymentUrl/sessionId", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/fatture/8/pagamenti")
      .set("Authorization", authHeader("COMMERCIALE", 8413))
      .send({ importo: 244.0, metodo: "CONTANTE", dataPagamento: "2026-02-10" });

    const response = await request(app)
      .post("/api/pagamenti/crea-link/8")
      .set("Authorization", authHeader("COMMERCIALE", 8414))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body?.paymentUrl).toBeUndefined();
    expect(response.body?.sessionId).toBeUndefined();
  });
});

describe("AC-3 - Webhook checkout.session.completed", () => {
  it("Tests AC-3: Given evento checkout.session.completed con metadata.fatturaId=8 When POST /api/webhooks/stripe Then HTTP 200", async () => {
    await seedFattureUntil(8);

    const response = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=1739404800,v1=valid-signature")
      .send(buildStripeCompletedEvent());

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.any(Object));
  });

  it("Tests AC-3: Given webhook completato When GET /api/fatture/8 Then stato PAGATA e pagamento STRIPE con dataPagamento 2025-02-13", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=1739404800,v1=valid-signature")
      .send(buildStripeCompletedEvent());

    const detailResponse = await request(app)
      .get("/api/fatture/8")
      .set("Authorization", authHeader("COMMERCIALE", 8422));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("PAGATA");
    expect(detailResponse.body?.data?.pagamenti?.[0]?.metodo).toBe("STRIPE");
    expect(detailResponse.body?.data?.pagamenti?.[0]?.dataPagamento).toBe("2025-02-13");
  });
});

describe("AC-4 - Firma webhook invalida", () => {
  it("Tests AC-4: Given stripe-signature invalida When POST /api/webhooks/stripe Then HTTP 400 Invalid signature", async () => {
    await seedFattureUntil(8);

    const response = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=1739404800,v1=invalid")
      .send(buildStripeCompletedEvent());

    expect(response.status).toBe(400);
    expect(response.body?.error?.message).toBe("Invalid signature");
  });

  it("Tests AC-4: Given firma invalida When POST /api/webhooks/stripe Then nessun pagamento viene creato su fattura 8", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=1739404800,v1=invalid")
      .send(buildStripeCompletedEvent());

    const detailResponse = await request(app)
      .get("/api/fatture/8")
      .set("Authorization", authHeader("COMMERCIALE", 8432));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.pagamenti?.length).toBe(0);
    expect(detailResponse.body?.data?.stato).toBe("EMESSA");
  });
});

describe("AC-5 - Idempotenza evento duplicato", () => {
  it("Tests AC-5: Given pagamento gia registrato per sessionId cs_test_link_8 When POST evento duplicato Then HTTP 200", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=1739404800,v1=valid-signature")
      .send(buildStripeCompletedEvent());

    const duplicateResponse = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=1739404800,v1=valid-signature")
      .send(buildStripeCompletedEvent());

    expect(duplicateResponse.status).toBe(200);
    expect(duplicateResponse.body).toEqual(expect.any(Object));
  });

  it("Tests AC-5: Given evento duplicato stripe su sessionId gia processato When POST /api/webhooks/stripe Then pagamenti.length resta 1", async () => {
    await seedFattureUntil(8);

    await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=1739404800,v1=valid-signature")
      .send(buildStripeCompletedEvent());

    await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "t=1739404800,v1=valid-signature")
      .send(buildStripeCompletedEvent());

    const detailResponse = await request(app)
      .get("/api/fatture/8")
      .set("Authorization", authHeader("COMMERCIALE", 8442));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.pagamenti?.length).toBe(1);
    expect(detailResponse.body?.data?.stato).toBe("PAGATA");
  });
});
