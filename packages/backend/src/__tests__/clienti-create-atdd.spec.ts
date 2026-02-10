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

function authHeader(role: Role, userId = 1000): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Creazione cliente da utente autenticato", () => {
  it("should return 201 for authenticated COMMERCIALE and generate codiceCliente CLI-000001", async () => {
    const response = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("COMMERCIALE", 2000))
      .send({
        nome: "Rossi Mario",
        tipologia: "PRIVATO",
        codiceFiscale: "RSSMRA80A01H501U",
        telefono: "3331234567",
        email: "mario@test.it",
        indirizzo: "Via Roma 1",
        cap: "00100",
        citta: "Roma",
        provincia: "RM",
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toEqual(expect.any(Number));
    expect(response.body.codiceCliente).toBe("CLI-000001");
  });

  it("should persist payload business fields on creation", async () => {
    const response = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("COMMERCIALE", 2001))
      .send({
        nome: "Rossi Mario",
        tipologia: "PRIVATO",
        codiceFiscale: "RSSMRA80A01H501U",
        telefono: "3331234567",
        email: "mario@test.it",
        indirizzo: "Via Roma 1",
        cap: "00100",
        citta: "Roma",
        provincia: "RM",
      });

    expect(response.status).toBe(201);
    expect(response.body.nome).toBe("Rossi Mario");
    expect(response.body.email).toBe("mario@test.it");
  });
});

describe("AC-2 - Validazione partita IVA su cliente AZIENDA", () => {
  it("should accept 11-digit partitaIva and create AZIENDA with 201", async () => {
    const response = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        nome: "ACME SRL",
        tipologia: "AZIENDA",
        partitaIva: "12345678901",
        email: "acme@test.it",
        indirizzo: "Via Milano 10",
        cap: "20100",
        citta: "Milano",
        provincia: "MI",
      });

    expect(response.status).toBe(201);
    expect(response.body.tipologia).toBe("AZIENDA");
    expect(response.body.partitaIva).toBe("12345678901");
  });

  it("should reject invalid partitaIva format with 400", async () => {
    const response = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        nome: "ACME SRL",
        tipologia: "AZIENDA",
        partitaIva: "123",
        email: "acme-invalid@test.it",
        indirizzo: "Via Milano 10",
        cap: "20100",
        citta: "Milano",
        provincia: "MI",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.field).toBe("partitaIva");
  });
});

describe("AC-3 - Codice fiscale invalido", () => {
  it("should return 400 with Invalid fiscal code format", async () => {
    const response = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        nome: "Mario Rossi",
        tipologia: "PRIVATO",
        codiceFiscale: "INVALID",
        email: "mario.invalid@test.it",
        indirizzo: "Via Roma 1",
        cap: "00100",
        citta: "Roma",
        provincia: "RM",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.message).toBe("Invalid fiscal code format");
  });

  it("should report validation details for codiceFiscale field", async () => {
    const response = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        nome: "Mario Rossi",
        tipologia: "PRIVATO",
        codiceFiscale: "INVALID",
        email: "mario.invalid2@test.it",
        indirizzo: "Via Roma 1",
        cap: "00100",
        citta: "Roma",
        provincia: "RM",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.details.field).toBe("codiceFiscale");
    expect(response.body.error.details.rule).toBe("invalid_fiscal_code_format");
  });
});

describe("AC-4 - Email duplicata", () => {
  it("should return 409 when creating a second customer with duplicate email", async () => {
    await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        nome: "Cliente Uno",
        tipologia: "PRIVATO",
        codiceFiscale: "RSSMRA80A01H501U",
        email: "duplicate@test.it",
        indirizzo: "Via Roma 1",
        cap: "00100",
        citta: "Roma",
        provincia: "RM",
      });

    const secondResponse = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        nome: "Cliente Due",
        tipologia: "PRIVATO",
        codiceFiscale: "VRDLGI90A41F205X",
        email: "duplicate@test.it",
        indirizzo: "Via Roma 2",
        cap: "00100",
        citta: "Roma",
        provincia: "RM",
      });

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    expect(secondResponse.body.error.message).toBe("Email gia esistente");
  });

  it("should keep first customer and reject duplicate without creating new id", async () => {
    const firstResponse = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        nome: "Cliente Uno",
        tipologia: "PRIVATO",
        codiceFiscale: "RSSMRA80A01H501U",
        email: "duplicate@test.it",
        indirizzo: "Via Roma 1",
        cap: "00100",
        citta: "Roma",
        provincia: "RM",
      });

    const secondResponse = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        nome: "Cliente Due",
        tipologia: "PRIVATO",
        codiceFiscale: "VRDLGI90A41F205X",
        email: "duplicate@test.it",
        indirizzo: "Via Roma 2",
        cap: "00100",
        citta: "Roma",
        provincia: "RM",
      });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.id).toBeUndefined();
  });
});

describe("AC-5 - Validazione CAP/Provincia", () => {
  it("should reject invalid provincia ZZ with 400 invalid_provincia", async () => {
    const response = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        nome: "Mario Rossi",
        tipologia: "PRIVATO",
        codiceFiscale: "RSSMRA80A01H501U",
        email: "provincia.invalid@test.it",
        indirizzo: "Via Roma 1",
        cap: "00100",
        citta: "Roma",
        provincia: "ZZ",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.rule).toBe("invalid_provincia");
  });

  it("should reject non-numeric cap with 400 invalid_cap", async () => {
    const response = await request(app)
      .post("/api/clienti")
      .set("Authorization", authHeader("ADMIN"))
      .send({
        nome: "Mario Rossi",
        tipologia: "PRIVATO",
        codiceFiscale: "RSSMRA80A01H501U",
        email: "cap.invalid@test.it",
        indirizzo: "Via Roma 1",
        cap: "ABC",
        citta: "Roma",
        provincia: "RM",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.rule).toBe("invalid_cap");
  });
});
