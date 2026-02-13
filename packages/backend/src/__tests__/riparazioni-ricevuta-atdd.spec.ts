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
const TEST_TELEFONO = "+39-333-1234567";
const TEST_EMAIL = "cliente@test.it";
const TEST_ACCESSORI = "Caricabatterie, custodia";
const TEST_DATA_FORMATTATA = "09/02/2026";
const TEST_CONDIZIONI =
  "CONDIZIONI DI SERVIZIO: Il laboratorio non risponde di eventuali dati presenti sul dispositivo. Il cliente autorizza la diagnosi tecnica.";

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
    serialeDispositivo: index === 10 ? "SN-REC-10" : `SN-REC-${index}`,
    descrizioneProblema:
      index === 10 ? "Schermo non si accende" : `Problema ricevuta ${index}`,
    accessoriConsegnati: index === 10 ? TEST_ACCESSORI : "Caricabatterie",
    priorita: index % 2 === 0 ? "ALTA" : "NORMALE",
    ...overrides,
  };
}

function seedClienteRossiMario(): void {
  seedClienteForTests({
    id: TEST_CLIENTE_ID,
    nome: TEST_CLIENTE_NOME,
    codiceCliente: TEST_CLIENTE_CODICE,
    telefono: TEST_TELEFONO,
    email: TEST_EMAIL,
    tipologia: "PRIVATO",
  });
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

describe("AC-1 - PDF A4 ricevuta con sezioni obbligatorie", () => {
  it('Tests AC-1: Given repair id=10 with full customer/device/intake data When GET /api/riparazioni/10/ricevuta as TECNICO Then 200 with application/pdf and filename ricevuta-riparazione-10.pdf', async () => {
    seedClienteRossiMario();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/ricevuta")
      .set("Authorization", authHeader("TECNICO", 7301))
      .buffer(true);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain(
      'filename="ricevuta-riparazione-10.pdf"',
    );
  });

  it('Tests AC-1: Given repair id=10 with complete intake data When GET /api/riparazioni/10/ricevuta Then PDF starts with %PDF and includes customer/device/problem/conditions/signature sections', async () => {
    seedClienteRossiMario();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/ricevuta")
      .set("Authorization", authHeader("TECNICO", 7302))
      .buffer(true);

    const bodyText = responseBodyAsText(response);

    expect(response.status).toBe(200);
    expect(bodyText.startsWith("%PDF")).toBe(true);
    expect(bodyText).toContain(TEST_CLIENTE_NOME);
    expect(bodyText).toContain(TEST_TELEFONO);
    expect(bodyText).toContain(TEST_EMAIL);
    expect(bodyText).toContain("Dati cliente");
    expect(bodyText).toContain("Dispositivo");
    expect(bodyText).toContain("Smartphone");
    expect(bodyText).toContain("Samsung");
    expect(bodyText).toContain("Galaxy S21");
    expect(bodyText).toContain("SN-REC-10");
    expect(bodyText).toContain("Descrizione problema");
    expect(bodyText).toContain("Schermo non si accende");
    expect(bodyText).toContain(TEST_CONDIZIONI);
    expect(bodyText).toContain("Firma Cliente: ____________________");
  });
});

describe("AC-2 - Accessori consegnati mostrati per elemento", () => {
  it('Tests AC-2: Given accessoriConsegnati=\"Caricabatterie, custodia\" When GET /api/riparazioni/10/ricevuta Then PDF contains separate rows "- Caricabatterie" and "- custodia"', async () => {
    seedClienteRossiMario();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/ricevuta")
      .set("Authorization", authHeader("TECNICO", 7401))
      .buffer(true);

    const bodyText = responseBodyAsText(response);

    expect(response.status).toBe(200);
    expect(bodyText).toContain("- Caricabatterie");
    expect(bodyText).toContain("- custodia");
  });

  it('Tests AC-2: Given accessoriConsegnati has comma-separated items When GET /api/riparazioni/10/ricevuta Then PDF does not contain merged token "Caricabatterie custodia"', async () => {
    seedClienteRossiMario();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/ricevuta")
      .set("Authorization", authHeader("TECNICO", 7402))
      .buffer(true);

    const bodyText = responseBodyAsText(response);

    expect(response.status).toBe(200);
    expect(bodyText).not.toContain("Caricabatterie custodia");
    expect(bodyText).toContain("Accessori consegnati");
  });
});

describe("AC-3 - Data ricezione formattata dd/MM/yyyy", () => {
  it('Tests AC-3: Given dataRicezione 2026-02-09T10:00:00.000Z When GET /api/riparazioni/10/ricevuta Then PDF contains 09/02/2026', async () => {
    seedClienteRossiMario();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/ricevuta")
      .set("Authorization", authHeader("TECNICO", 7501))
      .buffer(true);

    const bodyText = responseBodyAsText(response);

    expect(response.status).toBe(200);
    expect(bodyText).toContain(TEST_DATA_FORMATTATA);
    expect(bodyText).toContain("Data ricezione");
  });

  it('Tests AC-3: Given same receipt request When GET /api/riparazioni/10/ricevuta Then PDF does not keep ISO date format 2026-02-09', async () => {
    seedClienteRossiMario();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/ricevuta")
      .set("Authorization", authHeader("TECNICO", 7502))
      .buffer(true);

    const bodyText = responseBodyAsText(response);

    expect(response.status).toBe(200);
    expect(bodyText).not.toContain("2026-02-09");
    expect(bodyText).toContain(TEST_DATA_FORMATTATA);
  });
});

describe("AC-4 - Richiesta non autenticata rifiutata", () => {
  it("Tests AC-4: Given request without Authorization header When GET /api/riparazioni/10/ricevuta Then 401 and JSON body contains error", async () => {
    seedClienteRossiMario();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/ricevuta")
      .buffer(true);

    expect(response.status).toBe(401);
    expect(typeof response.body?.error).toBe("string");
    expect(String(response.body?.error ?? "").length).toBeGreaterThan(0);
  });

  it("Tests AC-4: Given unauthenticated request When GET /api/riparazioni/10/ricevuta Then response is not a PDF payload", async () => {
    seedClienteRossiMario();
    await seedUntilRiparazioneId10();

    const response = await request(app)
      .get("/api/riparazioni/10/ricevuta")
      .buffer(true);

    expect(response.status).toBe(401);
    expect(response.headers["content-type"] ?? "").not.toContain("application/pdf");
    expect(response.body?.data).toBeUndefined();
  });
});

describe("Hardening - Riparazione non trovata su endpoint ricevuta", () => {
  it("Given riparazione id=999 does not exist When GET /api/riparazioni/999/ricevuta as TECNICO Then 404 with RIPARAZIONE_NOT_FOUND", async () => {
    const response = await request(app)
      .get("/api/riparazioni/999/ricevuta")
      .set("Authorization", authHeader("TECNICO", 7601));

    expect(response.status).toBe(404);
    expect(response.body?.error?.code).toBe("RIPARAZIONE_NOT_FOUND");
    expect(response.body?.error?.message).toBe("Riparazione non trovata");
  });

  it("Given riparazione id=999 does not exist When GET /api/riparazioni/999/ricevuta Then response has no data payload", async () => {
    const response = await request(app)
      .get("/api/riparazioni/999/ricevuta")
      .set("Authorization", authHeader("TECNICO", 7602));

    expect(response.status).toBe(404);
    expect(response.body?.data).toBeUndefined();
    expect(response.body?.error).toEqual(
      expect.objectContaining({
        code: "RIPARAZIONE_NOT_FOUND",
      }),
    );
  });
});
