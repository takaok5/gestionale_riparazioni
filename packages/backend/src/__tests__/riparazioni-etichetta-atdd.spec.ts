import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import {
  resetAnagraficheStoreForTests,
  seedClienteForTests,
} from "../services/anagrafiche-service.js";
import { resetRiparazioniStoreForTests } from "../services/riparazioni-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

const TEST_CLIENTE_ID = 5;
const TEST_CLIENTE_CODICE = "CLI-000005";
const TEST_CLIENTE_NOME = "Rossi Mario";
const TEST_RIPARAZIONE_CODICE = "RIP-20260209-0001";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign(
    { ...payload, tokenType: "access" as const },
    "test-jwt-secret",
    { expiresIn: "15m" },
  );
}

function authHeader(role: Role, userId = 7000): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildRiparazionePayload(
  index: number,
  overrides?: Partial<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    clienteId: TEST_CLIENTE_ID,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: index === 10 ? "Samsung" : `Marca-${index}`,
    modelloDispositivo: index === 10 ? "Galaxy S21" : `Modello-${index}`,
    serialeDispositivo: `SN-LABEL-${index}`,
    descrizioneProblema: `Problema etichetta ${index}`,
    accessoriConsegnati: "Caricabatterie",
    priorita: index % 2 === 0 ? "ALTA" : "NORMALE",
    ...overrides,
  };
}

async function createRiparazione(index: number, userId = 7100) {
  return request(app)
    .post("/api/riparazioni")
    .set("Authorization", authHeader("TECNICO", userId))
    .send(buildRiparazionePayload(index));
}

async function seedUntilRiparazioneId10(): Promise<void> {
  for (let index = 1; index <= 10; index += 1) {
    const created = await createRiparazione(index, 7200 + index);
    expect(created.status).toBe(201);
    expect(created.body.id).toBe(index);
  }
}

function responseBodyAsText(response: request.Response): string {
  if (Buffer.isBuffer(response.body)) {
    return response.body.toString("utf8");
  }

  if (typeof response.text === "string") {
    return response.text;
  }

  return "";
}

function seedClienteRossiMario(): void {
  seedClienteForTests({
    id: TEST_CLIENTE_ID,
    nome: TEST_CLIENTE_NOME,
    codiceCliente: TEST_CLIENTE_CODICE,
    tipologia: "PRIVATO",
  });
}

function seedClienteCodiceFallback(): void {
  seedClienteForTests({
    id: TEST_CLIENTE_ID,
    nome: "",
    codiceCliente: TEST_CLIENTE_CODICE,
    tipologia: "PRIVATO",
  });
}

function expectQrPayloadInPdf(bodyText: string, payload: string): void {
  expect(bodyText).toContain(`QR:${payload}`);
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

describe("AC-1 - Etichetta PDF 62x100mm con QR e dati riparazione", () => {
  it('Tests AC-1: Given riparazione id=10 con codiceRiparazione "RIP-20260209-0001", cliente "Rossi Mario", dispositivo "Samsung Galaxy S21" When GET /api/riparazioni/10/etichetta as TECNICO Then 200 with application/pdf and attachment filename', async () => {
    seedClienteRossiMario();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/etichetta")
      .set("Authorization", authHeader("TECNICO", 7301))
      .buffer(true);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain(
      'filename="etichetta-riparazione-10.pdf"',
    );
  });

  it('Tests AC-1: Given riparazione id=10 with dataRicezione 2026-02-09T10:00:00.000Z When GET /api/riparazioni/10/etichetta Then PDF payload starts with %PDF and contains RIP-20260209-0001, Rossi Mario, Samsung, Galaxy S21, 09/02/2026 and QR payload RIP-20260209-0001', async () => {
    seedClienteRossiMario();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/etichetta")
      .set("Authorization", authHeader("TECNICO", 7302))
      .buffer(true);

    const bodyText = responseBodyAsText(response);

    expect(response.status).toBe(200);
    expect(bodyText.startsWith("%PDF")).toBe(true);
    expectQrPayloadInPdf(bodyText, TEST_RIPARAZIONE_CODICE);
    expect(bodyText).toContain(TEST_CLIENTE_NOME);
    expect(bodyText).toContain("Samsung");
    expect(bodyText).toContain("Galaxy S21");
    expect(bodyText).toContain("09/02/2026");
  });
});

describe("AC-2 - Fallback codiceCliente quando nome cliente assente", () => {
  it('Tests AC-2: Given riparazione id=10 with cliente.nome empty and codiceCliente CLI-000005 When GET /api/riparazioni/10/etichetta as TECNICO Then PDF customer line shows CLI-000005', async () => {
    seedClienteCodiceFallback();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/etichetta")
      .set("Authorization", authHeader("TECNICO", 7401))
      .buffer(true);

    const bodyText = responseBodyAsText(response);

    expect(response.status).toBe(200);
    expect(bodyText).toContain(TEST_CLIENTE_CODICE);
    expect(bodyText).not.toContain(TEST_CLIENTE_NOME);
  });

  it("Tests AC-2: Given fallback scenario When GET /api/riparazioni/10/etichetta Then PDF still includes codiceRiparazione, marca, modello and formatted dataRicezione", async () => {
    seedClienteCodiceFallback();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/etichetta")
      .set("Authorization", authHeader("TECNICO", 7402))
      .buffer(true);

    const bodyText = responseBodyAsText(response);

    expect(response.status).toBe(200);
    expect(bodyText).toContain(TEST_RIPARAZIONE_CODICE);
    expect(bodyText).toContain("Samsung");
    expect(bodyText).toContain("Galaxy S21");
    expect(bodyText).toContain("09/02/2026");
  });
});

describe("AC-3 - Riparazione non trovata su endpoint etichetta", () => {
  it("Tests AC-3: Given riparazione id=999 does not exist When GET /api/riparazioni/999/etichetta as TECNICO Then 404 with RIPARAZIONE_NOT_FOUND and message Riparazione non trovata", async () => {
    const response = await request(app)
      .get("/api/riparazioni/999/etichetta")
      .set("Authorization", authHeader("TECNICO", 7501));

    expect(response.status).toBe(404);
    expect(response.body?.error?.code).toBe("RIPARAZIONE_NOT_FOUND");
    expect(response.body?.error?.message).toBe("Riparazione non trovata");
  });

  it("Tests AC-3: Given riparazione id=999 does not exist When GET /api/riparazioni/999/etichetta Then response has no data payload", async () => {
    const response = await request(app)
      .get("/api/riparazioni/999/etichetta")
      .set("Authorization", authHeader("TECNICO", 7502));

    expect(response.status).toBe(404);
    expect(response.body?.data).toBeUndefined();
    expect(response.body?.error).toEqual(
      expect.objectContaining({
        code: "RIPARAZIONE_NOT_FOUND",
      }),
    );
  });
});
