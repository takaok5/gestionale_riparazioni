import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
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

async function createAziendaCliente(index: number) {
  return request(app)
    .post("/api/clienti")
    .set("Authorization", authHeader("COMMERCIALE", 7000 + index))
    .send({
      nome: `Cliente Story ${index}`,
      ragioneSociale: `Story Cliente ${index} SRL`,
      tipologia: "AZIENDA",
      partitaIva: String(10000000000 + index),
      telefono: `33312345${String(index).padStart(2, "0")}`,
      email: `story23-${index}@test.it`,
      indirizzo: `Via Story ${index}`,
      cap: "20100",
      citta: "Milano",
      provincia: "MI",
    });
}

async function seedUntilClienteId5(): Promise<void> {
  for (let i = 1; i <= 4; i += 1) {
    const created = await createAziendaCliente(i);
    expect(created.status).toBe(201);
  }
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Dettaglio cliente esistente", () => {
  it("Tests AC-1: Given cliente id=5 exists When GET /api/clienti/5 Then 200 with full cliente data", async () => {
    await seedUntilClienteId5();

    const response = await request(app)
      .get("/api/clienti/5")
      .set("Authorization", authHeader("COMMERCIALE", 7101));

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(5);
    expect(response.body?.data?.codiceCliente).toMatch(/^CLI-\d{6}$/);
  });

  it("Tests AC-1: Given cliente id=5 exists When GET /api/clienti/5 Then payload includes all required fields", async () => {
    await seedUntilClienteId5();

    const response = await request(app)
      .get("/api/clienti/5")
      .set("Authorization", authHeader("COMMERCIALE", 7102));

    expect(response.status).toBe(200);
    expect(response.body?.data).toEqual(
      expect.objectContaining({
        id: 5,
        codiceCliente: expect.stringMatching(/^CLI-\d{6}$/),
        nome: expect.any(String),
        tipologia: expect.any(String),
        telefono: expect.any(String),
        email: expect.any(String),
        indirizzo: expect.any(String),
        cap: expect.any(String),
        citta: expect.any(String),
        provincia: expect.any(String),
      }),
    );
  });
});

describe("AC-2 - Cliente non trovato", () => {
  it("Tests AC-2: Given cliente id=999 does not exist When GET /api/clienti/999 Then 404 CLIENTE_NOT_FOUND", async () => {
    const response = await request(app)
      .get("/api/clienti/999")
      .set("Authorization", authHeader("COMMERCIALE", 7201));

    expect(response.status).toBe(404);
    expect(response.body?.error?.code).toBe("CLIENTE_NOT_FOUND");
  });

  it("Tests AC-2: Given cliente id=999 does not exist When GET /api/clienti/999 Then error payload keeps explicit contract", async () => {
    const response = await request(app)
      .get("/api/clienti/999")
      .set("Authorization", authHeader("COMMERCIALE", 7202));

    expect(response.status).toBe(404);
    expect(response.body?.error).toEqual(
      expect.objectContaining({
        code: "CLIENTE_NOT_FOUND",
      }),
    );
  });
});

describe("AC-3 - Modifica cliente", () => {
  it("Tests AC-3: Given cliente id=5 exists When PUT /api/clienti/5 with telefono/email Then 200 with updated data", async () => {
    await seedUntilClienteId5();

    const response = await request(app)
      .put("/api/clienti/5")
      .set("Authorization", authHeader("COMMERCIALE", 7301))
      .send({ telefono: "3339876543", email: "newemail@test.it" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(5);
    expect(response.body?.data?.telefono).toBe("3339876543");
    expect(response.body?.data?.email).toBe("newemail@test.it");
  });

  it("Tests AC-3: Given update succeeded When GET /api/clienti/5 Then persisted telefono/email are returned", async () => {
    await seedUntilClienteId5();

    await request(app)
      .put("/api/clienti/5")
      .set("Authorization", authHeader("COMMERCIALE", 7302))
      .send({ telefono: "3339876543", email: "newemail@test.it" });

    const response = await request(app)
      .get("/api/clienti/5")
      .set("Authorization", authHeader("COMMERCIALE", 7303));

    expect(response.status).toBe(200);
    expect(response.body?.data?.telefono).toBe("3339876543");
    expect(response.body?.data?.email).toBe("newemail@test.it");
  });
});

describe("AC-4 - Lista riparazioni cliente", () => {
  it("Tests AC-4: Given cliente id=5 has 3 riparazioni When GET /api/clienti/5/riparazioni Then 200 with array of 3", async () => {
    await seedUntilClienteId5();

    const response = await request(app)
      .get("/api/clienti/5/riparazioni")
      .set("Authorization", authHeader("COMMERCIALE", 7401));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data)).toBe(true);
    expect(response.body?.data).toHaveLength(3);
  });

  it("Tests AC-4: Given cliente id=5 has 3 riparazioni When GET /api/clienti/5/riparazioni Then each row contains required projection", async () => {
    await seedUntilClienteId5();

    const response = await request(app)
      .get("/api/clienti/5/riparazioni")
      .set("Authorization", authHeader("COMMERCIALE", 7402));

    expect(response.status).toBe(200);
    const rows = (response.body?.data ?? []) as Array<Record<string, unknown>>;
    expect(rows.length).toBe(3);
    for (const row of rows) {
      expect(row).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          codiceRiparazione: expect.any(String),
          stato: expect.any(String),
          dataRicezione: expect.any(String),
          tipoDispositivo: expect.any(String),
        }),
      );
    }
  });
});
