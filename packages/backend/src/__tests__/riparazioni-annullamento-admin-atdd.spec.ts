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
    modelloDispositivo: `Model-CANCEL-${index}`,
    serialeDispositivo: `SN-CANCEL-${index}`,
    descrizioneProblema: `Problema cancellazione ${index}`,
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

describe("AC-1 - Admin annulla da IN_LAVORAZIONE con nota", () => {
  it('Tests AC-1: Given ADMIN userId=1 and riparazione 10 in stato IN_LAVORAZIONE When PATCH /api/riparazioni/10/stato {"stato":"ANNULLATA","note":"Cliente ha ritirato dispositivo"} Then 200 with data.stato ANNULLATA', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_LAVORAZIONE");

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("ADMIN", 1))
      .send({ stato: "ANNULLATA", note: "Cliente ha ritirato dispositivo" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(10);
    expect(response.body?.data?.stato).toBe("ANNULLATA");
  });

  it('Tests AC-1: Given admin cancellation succeeds When GET /api/riparazioni/10 Then latest statiHistory row has stato ANNULLATA userId 1 note "Cliente ha ritirato dispositivo"', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_LAVORAZIONE");

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("ADMIN", 1))
      .send({ stato: "ANNULLATA", note: "Cliente ha ritirato dispositivo" });

    expect(patchResponse.status).toBe(200);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("ANNULLATA");
    expect(Array.isArray(detailResponse.body?.data?.statiHistory)).toBe(true);
    expect((detailResponse.body?.data?.statiHistory ?? []).length).toBeGreaterThan(0);

    const history = detailResponse.body?.data?.statiHistory ?? [];
    const latest = history[history.length - 1];
    expect(latest?.stato).toBe("ANNULLATA");
    expect(latest?.userId).toBe(1);
    expect(latest?.note).toBe("Cliente ha ritirato dispositivo");
    expect(Number.isNaN(Date.parse(String(latest?.dataOra ?? "")))).toBe(false);
  });
});

describe("AC-2 - Admin annulla da RICEVUTA senza nota", () => {
  it('Tests AC-2: Given ADMIN userId=1 and riparazione 10 in stato RICEVUTA When PATCH /api/riparazioni/10/stato {"stato":"ANNULLATA"} Then 200 with data.stato ANNULLATA', async () => {
    await prepareBaseScenario();

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("ADMIN", 1))
      .send({ stato: "ANNULLATA" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(10);
    expect(response.body?.data?.stato).toBe("ANNULLATA");
  });

  it('Tests AC-2: Given admin cancellation without note succeeds When GET /api/riparazioni/10 Then latest statiHistory row has stato ANNULLATA userId 1 note ""', async () => {
    await prepareBaseScenario();

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("ADMIN", 1))
      .send({ stato: "ANNULLATA" });

    expect(patchResponse.status).toBe(200);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.stato).toBe("ANNULLATA");

    const history = detailResponse.body?.data?.statiHistory ?? [];
    const latest = history[history.length - 1];
    expect(latest?.stato).toBe("ANNULLATA");
    expect(latest?.userId).toBe(1);
    expect(latest?.note).toBe("");
  });
});

describe("AC-3 - Tecnico non admin non puo' annullare", () => {
  it('Tests AC-3: Given TECNICO userId=7 assigned to riparazione 10 in stato IN_LAVORAZIONE When PATCH /api/riparazioni/10/stato {"stato":"ANNULLATA"} Then 403 FORBIDDEN with exact message', async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_LAVORAZIONE");

    const response = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "ANNULLATA" });

    expect(response.status).toBe(403);
    expect(response.body?.error?.code).toBe("FORBIDDEN");
    expect(response.body?.error?.message).toBe("Only admins can cancel repairs");
  });

  it("Tests AC-3: Given cancellation by non-admin tecnico fails When GET /api/riparazioni/10 Then stato remains IN_LAVORAZIONE and history length is unchanged", async () => {
    await prepareBaseScenario();
    setRiparazioneStatoForTests(10, "IN_LAVORAZIONE");

    const beforeDetail = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(beforeDetail.status).toBe(200);
    const beforeHistoryLength = (beforeDetail.body?.data?.statiHistory ?? []).length;

    const patchResponse = await request(app)
      .patch("/api/riparazioni/10/stato")
      .set("Authorization", authHeader("TECNICO", 7))
      .send({ stato: "ANNULLATA" });

    expect(patchResponse.status).toBe(403);

    const afterDetail = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("TECNICO", 7));

    expect(afterDetail.status).toBe(200);
    expect(afterDetail.body?.data?.stato).toBe("IN_LAVORAZIONE");
    expect((afterDetail.body?.data?.statiHistory ?? []).length).toBe(
      beforeHistoryLength,
    );
  });
});
