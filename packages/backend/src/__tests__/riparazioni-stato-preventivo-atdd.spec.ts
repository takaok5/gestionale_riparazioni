import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import {
  resetRiparazioniStoreForTests,
  setRiparazioneStatoForTests,
} from "../services/riparazioni-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

interface PreventivoTransitionCase {
  acId: number;
  title: string;
  fromStato: string;
  toStato: string;
  note: string;
}

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

function buildRiparazionePayload(index: number): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: "Samsung",
    modelloDispositivo: `Model-STATO-PREV-${index}`,
    serialeDispositivo: `SN-STATO-PREV-${index}`,
    descrizioneProblema: `Problema stato preventivo ${index}`,
    accessoriConsegnati: "Caricabatterie",
    priorita: "NORMALE",
  };
}

async function seedUsersUpToId8(): Promise<void> {
  const users = [
    { role: "ADMIN", username: "u3-admin", email: "u3-admin@example.com" },
    { role: "TECNICO", username: "u4-tecnico", email: "u4-tecnico@example.com" },
    {
      role: "COMMERCIALE",
      username: "u5-commerciale",
      email: "u5-commerciale@example.com",
    },
    { role: "ADMIN", username: "u6-admin", email: "u6-admin@example.com" },
    { role: "TECNICO", username: "u7-tecnico", email: "u7-tecnico@example.com" },
    { role: "TECNICO", username: "u8-tecnico", email: "u8-tecnico@example.com" },
  ] as const;

  for (const [index, user] of users.entries()) {
    const expectedId = index + 3;
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", authHeader("ADMIN", 19999))
      .send({
        username: user.username,
        email: user.email,
        password: "Password1",
        role: user.role,
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(expectedId);
    expect(response.body.role).toBe(user.role);
  }
}

async function seedRiparazioniUntilId10(): Promise<void> {
  for (let index = 1; index <= 10; index += 1) {
    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 7))
      .send(buildRiparazionePayload(index));

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(index);
  }
}

async function prepareBaseScenario(): Promise<void> {
  await seedUsersUpToId8();
  await seedRiparazioniUntilId10();
}

async function getDettaglioStatiHistoryLength(): Promise<number> {
  const detailResponse = await request(app)
    .get("/api/riparazioni/10")
    .set("Authorization", authHeader("TECNICO", 7));

  expect(detailResponse.status).toBe(200);
  const history = detailResponse.body?.data?.statiHistory ?? [];
  expect(Array.isArray(history)).toBe(true);
  return history.length;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-11T10:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

const preventivoTransitions: PreventivoTransitionCase[] = [
  {
    acId: 1,
    title: "IN_DIAGNOSI -> PREVENTIVO_EMESSO",
    fromStato: "IN_DIAGNOSI",
    toStato: "PREVENTIVO_EMESSO",
    note: "Preventivo emesso",
  },
  {
    acId: 2,
    title: "PREVENTIVO_EMESSO -> IN_ATTESA_APPROVAZIONE",
    fromStato: "PREVENTIVO_EMESSO",
    toStato: "IN_ATTESA_APPROVAZIONE",
    note: "In attesa approvazione preventivo",
  },
  {
    acId: 3,
    title: "IN_ATTESA_APPROVAZIONE -> APPROVATA",
    fromStato: "IN_ATTESA_APPROVAZIONE",
    toStato: "APPROVATA",
    note: "Preventivo approvato",
  },
  {
    acId: 4,
    title: "IN_ATTESA_APPROVAZIONE -> ANNULLATA",
    fromStato: "IN_ATTESA_APPROVAZIONE",
    toStato: "ANNULLATA",
    note: "Preventivo annullato dal cliente",
  },
  {
    acId: 5,
    title: "APPROVATA -> IN_ATTESA_RICAMBI",
    fromStato: "APPROVATA",
    toStato: "IN_ATTESA_RICAMBI",
    note: "In attesa ricambi",
  },
  {
    acId: 6,
    title: "APPROVATA -> IN_LAVORAZIONE",
    fromStato: "APPROVATA",
    toStato: "IN_LAVORAZIONE",
    note: "Lavorazione autorizzata",
  },
  {
    acId: 7,
    title: "IN_ATTESA_RICAMBI -> IN_LAVORAZIONE",
    fromStato: "IN_ATTESA_RICAMBI",
    toStato: "IN_LAVORAZIONE",
    note: "Ricambi disponibili",
  },
];

for (const transitionCase of preventivoTransitions) {
  describe(`AC-${transitionCase.acId} - ${transitionCase.title}`, () => {
    it(
      `Tests AC-${transitionCase.acId}: Given riparazione 10 in stato ${transitionCase.fromStato} and assigned tecnico userId=7 When PATCH /api/riparazioni/10/stato with {"stato":"${transitionCase.toStato}","note":"${transitionCase.note}"} Then 200 with data.stato ${transitionCase.toStato}`,
      async () => {
        await prepareBaseScenario();
        setRiparazioneStatoForTests(10, transitionCase.fromStato);

        const response = await request(app)
          .patch("/api/riparazioni/10/stato")
          .set("Authorization", authHeader("TECNICO", 7))
          .send({ stato: transitionCase.toStato, note: transitionCase.note });

        expect(response.status).toBe(200);
        expect(response.body?.data?.id).toBe(10);
        expect(response.body?.data?.stato).toBe(transitionCase.toStato);
      },
    );

    it(
      `Tests AC-${transitionCase.acId}: Given transition to ${transitionCase.toStato} succeeds When GET /api/riparazioni/10 Then latest statiHistory row contains stato ${transitionCase.toStato}, userId 7 and note "${transitionCase.note}"`,
      async () => {
        await prepareBaseScenario();
        setRiparazioneStatoForTests(10, transitionCase.fromStato);

        const beforeLength = await getDettaglioStatiHistoryLength();

        const patchResponse = await request(app)
          .patch("/api/riparazioni/10/stato")
          .set("Authorization", authHeader("TECNICO", 7))
          .send({ stato: transitionCase.toStato, note: transitionCase.note });

        expect(patchResponse.status).toBe(200);

        const detailResponse = await request(app)
          .get("/api/riparazioni/10")
          .set("Authorization", authHeader("TECNICO", 7));

        expect(detailResponse.status).toBe(200);
        expect(detailResponse.body?.data?.stato).toBe(transitionCase.toStato);
        expect(Array.isArray(detailResponse.body?.data?.statiHistory)).toBe(true);

        const history = detailResponse.body?.data?.statiHistory ?? [];
        expect(history.length).toBe(beforeLength + 1);

        const latest = history[history.length - 1];
        expect(latest?.stato).toBe(transitionCase.toStato);
        expect(latest?.userId).toBe(7);
        expect(latest?.note).toBe(transitionCase.note);
        expect(Number.isNaN(Date.parse(String(latest?.dataOra ?? "")))).toBe(false);
      },
    );
  });
}

describe("AC-8 - Transizione non valida da PREVENTIVO_EMESSO", () => {
  it('Tests AC-8: Given riparazione 10 in stato PREVENTIVO_EMESSO When PATCH /api/riparazioni/10/stato {"stato":"IN_LAVORAZIONE","note":"Tentativo salto approvazione"} Then 400 VALIDATION_ERROR with exact message', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "PREVENTIVO_EMESSO");

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({
        stato: "IN_LAVORAZIONE",
        note: "Tentativo salto approvazione",
      });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
    expect(response.body?.error?.message).toBe(
      "Invalid state transition from PREVENTIVO_EMESSO to IN_LAVORAZIONE",
    );
  });

  it("Tests AC-8: Given invalid transition PREVENTIVO_EMESSO -> IN_LAVORAZIONE fails When GET /api/riparazioni/10 Then stato remains PREVENTIVO_EMESSO and history length is unchanged", async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "PREVENTIVO_EMESSO");

    const beforeLength = await getDettaglioStatiHistoryLength();

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({
        stato: "IN_LAVORAZIONE",
        note: "Tentativo salto approvazione",
      });

    expect(patchResponse.status).toBe(400);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("PREVENTIVO_EMESSO");
    expect(Array.isArray(detailResponse.body?.data?.statiHistory)).toBe(true);
    expect((detailResponse.body?.data?.statiHistory ?? []).length).toBe(beforeLength);
  });
});
