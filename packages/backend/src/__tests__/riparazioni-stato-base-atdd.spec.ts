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
    modelloDispositivo: `Model-STATO-${index}`,
    serialeDispositivo: `SN-STATO-${index}`,
    descrizioneProblema: `Problema stato ${index}`,
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

describe("AC-1 - RICEVUTA -> IN_DIAGNOSI con storico", () => {
  it('Tests AC-1: Given userId=7 role TECNICO assigned to riparazione 10 in stato RICEVUTA When PATCH /api/riparazioni/10/stato with {"stato":"IN_DIAGNOSI","note":"Iniziata diagnosi"} Then 200 with data {id:10, stato:IN_DIAGNOSI}', async () => {
    await prepareBaseScenario();

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "IN_DIAGNOSI", note: "Iniziata diagnosi" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(10);
    expect(response.body?.data?.stato).toBe("IN_DIAGNOSI");
    expect(response.body?.data?.notifica?.tipo).toBe("STATO_RIPARAZIONE");
    expect(response.body?.data?.notifica?.stato).toBe("INVIATA");
  });

  it('Tests AC-1: Given transition to IN_DIAGNOSI succeeds When GET /api/riparazioni/10 Then statiHistory latest row contains stato IN_DIAGNOSI, userId 7, note "Iniziata diagnosi"', async () => {
    await prepareBaseScenario();

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "IN_DIAGNOSI", note: "Iniziata diagnosi" });

    expect(patchResponse.status).toBe(200);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("IN_DIAGNOSI");
    expect(Array.isArray(detailResponse.body?.data?.statiHistory)).toBe(true);
    expect((detailResponse.body?.data?.statiHistory ?? []).length).toBeGreaterThan(0);

    const history = detailResponse.body?.data?.statiHistory ?? [];
    const latest = history[history.length - 1];
    expect(latest?.stato).toBe("IN_DIAGNOSI");
    expect(latest?.userId).toBe(7);
    expect(latest?.note).toBe("Iniziata diagnosi");
    expect(Number.isNaN(Date.parse(String(latest?.dataOra ?? "")))).toBe(false);
  });
});

describe("AC-2 - IN_DIAGNOSI -> IN_LAVORAZIONE", () => {
  it('Tests AC-2: Given riparazione 10 in stato IN_DIAGNOSI and assigned tecnico userId=7 When PATCH /api/riparazioni/10/stato {"stato":"IN_LAVORAZIONE"} Then 200 with data.stato IN_LAVORAZIONE', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_DIAGNOSI");

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "IN_LAVORAZIONE" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(10);
    expect(response.body?.data?.stato).toBe("IN_LAVORAZIONE");
    expect(response.body?.data?.notifica?.tipo).toBe("STATO_RIPARAZIONE");
    expect(response.body?.data?.notifica?.stato).toBe("INVIATA");
  });

  it("Tests AC-2: Given transition to IN_LAVORAZIONE succeeds When GET /api/riparazioni/10 Then current stato is IN_LAVORAZIONE", async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_DIAGNOSI");

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "IN_LAVORAZIONE" });

    expect(patchResponse.status).toBe(200);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("IN_LAVORAZIONE");
  });
});

describe("AC-3 - IN_LAVORAZIONE -> COMPLETATA", () => {
  it('Tests AC-3: Given riparazione 10 in stato IN_LAVORAZIONE and assigned tecnico userId=7 When PATCH /api/riparazioni/10/stato {"stato":"COMPLETATA"} Then 200 with data.stato COMPLETATA', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_LAVORAZIONE");

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "COMPLETATA" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(10);
    expect(response.body?.data?.stato).toBe("COMPLETATA");
    expect(response.body?.data?.notifica?.oggetto).toBe("Riparazione Completata");
    expect(response.body?.data?.notifica?.stato).toBe("INVIATA");
  });

  it("Tests AC-3: Given transition to COMPLETATA succeeds When GET /api/riparazioni/10 Then current stato is COMPLETATA", async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_LAVORAZIONE");

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "COMPLETATA" });

    expect(patchResponse.status).toBe(200);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("COMPLETATA");
  });
});

describe("AC-4 - COMPLETATA -> CONSEGNATA", () => {
  it('Tests AC-4: Given riparazione 10 in stato COMPLETATA and assigned tecnico userId=7 When PATCH /api/riparazioni/10/stato {"stato":"CONSEGNATA"} Then 200 with data.stato CONSEGNATA', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "COMPLETATA");

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "CONSEGNATA" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(10);
    expect(response.body?.data?.stato).toBe("CONSEGNATA");
    expect(response.body?.data?.notifica?.oggetto).toBe("Riparazione Consegnata");
    expect(response.body?.data?.notifica?.stato).toBe("INVIATA");
  });

  it("Tests AC-4: Given transition to CONSEGNATA succeeds When GET /api/riparazioni/10 Then current stato is CONSEGNATA", async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "COMPLETATA");

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "CONSEGNATA" });

    expect(patchResponse.status).toBe(200);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("CONSEGNATA");
  });
});

describe("AC-5 - Transizione non valida da RICEVUTA a COMPLETATA", () => {
  it('Tests AC-5: Given riparazione 10 in stato RICEVUTA and assigned tecnico userId=7 When PATCH /api/riparazioni/10/stato {"stato":"COMPLETATA"} Then 400 VALIDATION_ERROR with exact message', async () => {
    await prepareBaseScenario();

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "COMPLETATA" });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
    expect(response.body?.error?.message).toBe(
      "Invalid state transition from RICEVUTA to COMPLETATA",
    );
  });

  it("Tests AC-5: Given invalid transition request fails When GET /api/riparazioni/10 Then stato remains RICEVUTA and no new history entry is added", async () => {
    await prepareBaseScenario();

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "COMPLETATA" });

    expect(patchResponse.status).toBe(400);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("RICEVUTA");
    expect(detailResponse.body?.data?.statiHistory).toHaveLength(0);
  });
});

describe("AC-6 - Divieto per tecnico non assegnato", () => {
  it('Tests AC-6: Given userId=8 role TECNICO is not assigned to riparazione 10 assigned to tecnicoId=7 When PATCH /api/riparazioni/10/stato {"stato":"IN_DIAGNOSI"} Then 403 FORBIDDEN', async () => {
    await prepareBaseScenario();

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 8))
      .send({ stato: "IN_DIAGNOSI" });

    expect(response.status).toBe(403);
    expect(response.body?.error?.code).toBe("FORBIDDEN");
    expect(response.body?.error?.message).toBe("Accesso negato");
  });

  it("Tests AC-6: Given forbidden request by non assigned tecnico fails When GET /api/riparazioni/10 Then stato and history remain unchanged", async () => {
    await prepareBaseScenario();

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 8))
      .send({ stato: "IN_DIAGNOSI" });

    expect(patchResponse.status).toBe(403);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("RICEVUTA");
    expect(detailResponse.body?.data?.statiHistory).toHaveLength(0);
  });

  it('Tests AC-6: Given userId=7 role COMMERCIALE (not ADMIN) When PATCH /api/riparazioni/10/stato {"stato":"IN_DIAGNOSI"} Then 403 FORBIDDEN', async () => {
    await prepareBaseScenario();

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("COMMERCIALE", 7))
      .send({ stato: "IN_DIAGNOSI" });

    expect(response.status).toBe(403);
    expect(response.body?.error?.code).toBe("FORBIDDEN");
    expect(response.body?.error?.message).toBe("Accesso negato");
  });

  it("Tests AC-6: Given forbidden request by COMMERCIALE userId=7 When GET /api/riparazioni/10 Then stato and history remain unchanged", async () => {
    await prepareBaseScenario();

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("COMMERCIALE", 7))
      .send({ stato: "IN_DIAGNOSI" });

    expect(patchResponse.status).toBe(403);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("RICEVUTA");
    expect(detailResponse.body?.data?.statiHistory).toHaveLength(0);
  });
});
