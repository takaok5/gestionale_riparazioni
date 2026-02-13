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
    modelloDispositivo: `Model-NOTIFICA-${index}`,
    serialeDispositivo: `SN-NOTIFICA-${index}`,
    descrizioneProblema: `Problema notifica ${index}`,
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

  for (const user of users) {
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
  }
}

async function seedRiparazioniUntilId10(): Promise<void> {
  for (let index = 1; index <= 10; index += 1) {
    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 7))
      .send(buildRiparazionePayload(index));

    expect(response.status).toBe(201);
  }
}

async function prepareBaseScenario(): Promise<void> {
  await seedUsersUpToId8();
  await seedRiparazioniUntilId10();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-13T09:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  delete process.env.TEST_FAIL_RIPARAZIONI_EMAIL;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - RICEVUTA generates email and INVIATA Notifica", () => {
  it('Tests AC-1: Given riparazione id=10 and cliente@test.it When PATCH /api/riparazioni/10/stato sets stato=RICEVUTA Then 200 and email subject "Riparazione Ricevuta - RIP-20260209-0001" is returned in payload', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_DIAGNOSI");

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "RICEVUTA" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("RICEVUTA");
    expect(response.body?.data?.notifica?.oggetto).toBe(
      "Riparazione Ricevuta - RIP-20260209-0001",
    );
  });

  it('Tests AC-1: Given transition to RICEVUTA succeeds When GET /api/notifiche?tipo=STATO_RIPARAZIONE Then latest row has stato INVIATA and riferimentoId 10', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_DIAGNOSI");

    await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "RICEVUTA" });

    const notificheResponse = await request(app)
      .get("/api/notifiche?tipo=STATO_RIPARAZIONE")
      .set("Authorization", authHeader("ADMIN", 6));

    expect(notificheResponse.status).toBe(200);
    expect(Array.isArray(notificheResponse.body?.data)).toBe(true);
    const latest = (notificheResponse.body?.data ?? []).at(-1);
    expect(latest?.stato).toBe("INVIATA");
    expect(latest?.riferimentoId).toBe(10);
  });
});

describe("AC-2 - COMPLETATA sends ready-for-pickup email", () => {
  it('Tests AC-2: Given riparazione 10 in IN_LAVORAZIONE When PATCH /api/riparazioni/10/stato {"stato":"COMPLETATA"} Then 200 and email subject Riparazione Completata', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_LAVORAZIONE");

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "COMPLETATA" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("COMPLETATA");
    expect(response.body?.data?.notifica?.oggetto).toBe("Riparazione Completata");
  });

  it('Tests AC-2: Given completion transition succeeds When GET /api/notifiche?stato=INVIATA Then notifica body contains "La sua riparazione e pronta per il ritiro"', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_LAVORAZIONE");

    await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "COMPLETATA" });

    const notificheResponse = await request(app)
      .get("/api/notifiche?stato=INVIATA")
      .set("Authorization", authHeader("ADMIN", 6));

    expect(notificheResponse.status).toBe(200);
    const latest = (notificheResponse.body?.data ?? []).at(-1);
    expect(String(latest?.contenuto ?? "")).toContain(
      "La sua riparazione e pronta per il ritiro",
    );
  });
});

describe("AC-3 - CONSEGNATA sends delivery email", () => {
  it('Tests AC-3: Given riparazione 10 in COMPLETATA When PATCH /api/riparazioni/10/stato {"stato":"CONSEGNATA"} Then 200 and subject Riparazione Consegnata', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "COMPLETATA");

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "CONSEGNATA" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("CONSEGNATA");
    expect(response.body?.data?.notifica?.oggetto).toBe("Riparazione Consegnata");
  });

  it('Tests AC-3: Given consegna succeeds When GET /api/notifiche?tipo=STATO_RIPARAZIONE Then latest notification is INVIATA for riparazione 10', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "COMPLETATA");

    await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "CONSEGNATA" });

    const notificheResponse = await request(app)
      .get("/api/notifiche?tipo=STATO_RIPARAZIONE")
      .set("Authorization", authHeader("ADMIN", 6));

    expect(notificheResponse.status).toBe(200);
    const latest = (notificheResponse.body?.data ?? []).at(-1);
    expect(latest?.stato).toBe("INVIATA");
    expect(latest?.riferimentoId).toBe(10);
  });
});

describe("AC-4 - Email failure keeps status change and stores FALLITA", () => {
  it('Tests AC-4: Given email service fails When PATCH /api/riparazioni/10/stato {"stato":"CONSEGNATA"} Then 200 and stato CONSEGNATA', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "COMPLETATA");
    process.env.TEST_FAIL_RIPARAZIONI_EMAIL = "1";

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "CONSEGNATA" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(10);
    expect(response.body?.data?.stato).toBe("CONSEGNATA");
  });

  it('Tests AC-4: Given email service fails When GET /api/notifiche?stato=FALLITA Then latest notification has tipo STATO_RIPARAZIONE and riferimentoId 10', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "COMPLETATA");
    process.env.TEST_FAIL_RIPARAZIONI_EMAIL = "1";

    await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "CONSEGNATA" });

    const notificheResponse = await request(app)
      .get("/api/notifiche?stato=FALLITA")
      .set("Authorization", authHeader("ADMIN", 6));

    expect(notificheResponse.status).toBe(200);
    const latest = (notificheResponse.body?.data ?? []).at(-1);
    expect(latest?.tipo).toBe("STATO_RIPARAZIONE");
    expect(latest?.stato).toBe("FALLITA");
    expect(latest?.riferimentoId).toBe(10);
  });
});
