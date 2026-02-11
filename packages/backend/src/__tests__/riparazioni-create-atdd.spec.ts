import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
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

function authHeader(role: Role, userId = 3000): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildValidPayload(overrides?: Partial<Record<string, unknown>>): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: "Samsung",
    modelloDispositivo: "Galaxy S21",
    serialeDispositivo: "SN123456789",
    descrizioneProblema: "Schermo rotto",
    accessoriConsegnati: "Caricabatterie, custodia",
    priorita: "NORMALE",
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-09T10:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Creazione riparazione con stato iniziale RICEVUTA", () => {
  it("Tests AC-1: Given cliente id=5 exists When POST /api/riparazioni with full payload Then 201 with codiceRiparazione RIP-20260209-0001 and stato RICEVUTA", async () => {
    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 3100))
      .send(buildValidPayload());

    expect(response.status).toBe(201);
    expect(response.body.codiceRiparazione).toBe("RIP-20260209-0001");
    expect(response.body.stato).toBe("RICEVUTA");
  });

  it("Tests AC-1: Given payload has specific device fields When create succeeds Then response persists same values", async () => {
    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 3101))
      .send(buildValidPayload());

    expect(response.status).toBe(201);
    expect(response.body.clienteId).toBe(5);
    expect(response.body.tipoDispositivo).toBe("Smartphone");
    expect(response.body.serialeDispositivo).toBe("SN123456789");
  });
});

describe("AC-2 - Progressivo giornaliero codice riparazione", () => {
  it("Tests AC-2: Given 5 repairs already created on 2026-02-09 When create next repair Then code is RIP-20260209-0006", async () => {
    for (let index = 1; index <= 5; index += 1) {
      await request(app)
        .post("/api/riparazioni")
        .set("Authorization", authHeader("TECNICO", 3200 + index))
        .send(
          buildValidPayload({
            serialeDispositivo: `SN-SEED-${index}`,
          }),
        );
    }

    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 3210))
      .send(buildValidPayload({ serialeDispositivo: "SN-SEED-6" }));

    expect(response.status).toBe(201);
    expect(response.body.codiceRiparazione).toBe("RIP-20260209-0006");
    expect(response.body.codiceRiparazione.startsWith("RIP-20260209-")).toBe(true);
  });

  it("Tests AC-2: Given daily sequence is active When creating two consecutive repairs Then second code increments by one", async () => {
    const first = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 3220))
      .send(buildValidPayload({ serialeDispositivo: "SN-SEQ-1" }));

    const second = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 3221))
      .send(buildValidPayload({ serialeDispositivo: "SN-SEQ-2" }));

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.codiceRiparazione).toBe("RIP-20260209-0002");
  });
});

describe("AC-3 - Cliente inesistente", () => {
  it("Tests AC-3: Given clienteId=999 does not exist When POST /api/riparazioni Then returns 404 CLIENTE_NOT_FOUND", async () => {
    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 3300))
      .send(buildValidPayload({ clienteId: 999 }));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("CLIENTE_NOT_FOUND");
    expect(response.body.error.message).toBe("Cliente non trovato");
  });

  it("Tests AC-3: Given clienteId=999 does not exist When request fails Then response has no creation fields", async () => {
    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 3301))
      .send(buildValidPayload({ clienteId: 999 }));

    expect(response.status).toBe(404);
    expect(response.body.id).toBeUndefined();
    expect(response.body.codiceRiparazione).toBeUndefined();
  });
});

describe("AC-4 - Validazione campo tipoDispositivo", () => {
  it("Tests AC-4: Given tipoDispositivo is missing When POST /api/riparazioni Then returns 400 VALIDATION_ERROR with message", async () => {
    const payload = buildValidPayload();
    delete payload.tipoDispositivo;

    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 3400))
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.message).toBe("tipoDispositivo is required");
  });

  it("Tests AC-4: Given tipoDispositivo is missing When validation fails Then error details reference tipoDispositivo", async () => {
    const payload = buildValidPayload();
    delete payload.tipoDispositivo;

    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 3401))
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error.details.field).toBe("tipoDispositivo");
    expect(response.body.error.details.rule).toBe("required");
  });
});
