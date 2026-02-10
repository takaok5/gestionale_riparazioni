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

function buildFornitorePayload(overrides?: Partial<Record<string, unknown>>) {
  return {
    nome: "Ricambi SRL",
    categoria: "RICAMBI",
    partitaIva: "12345678901",
    telefono: "0612345678",
    email: "info@ricambi.it",
    indirizzo: "Via Milano 10",
    cap: "20100",
    citta: "Milano",
    provincia: "MI",
    ...overrides,
  };
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Admin crea fornitore con codice FOR-000001", () => {
  it("returns 201 with id and codiceFornitore FOR-000001 for first supplier", async () => {
    const response = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("ADMIN", 1000))
      .send(buildFornitorePayload());

    expect(response.status).toBe(201);
    expect(response.body.id).toEqual(expect.any(Number));
    expect(response.body.codiceFornitore).toBe("FOR-000001");
  });

  it("persists categoria RICAMBI and partitaIva in response body", async () => {
    const response = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("ADMIN", 1001))
      .send(buildFornitorePayload());

    expect(response.status).toBe(201);
    expect(response.body.categoria).toBe("RICAMBI");
    expect(response.body.partitaIva).toBe("12345678901");
  });
});

describe("AC-2 - Categoria SERVIZI accettata", () => {
  it("returns 201 when categoria is SERVIZI", async () => {
    const response = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("ADMIN", 1002))
      .send(
        buildFornitorePayload({
          nome: "Assistenza Roma",
          categoria: "SERVIZI",
          partitaIva: "98765432109",
          telefono: "0698765432",
          email: "supporto@assistenza.it",
          indirizzo: "Via Appia 22",
          cap: "00181",
          citta: "Roma",
          provincia: "RM",
        }),
      );

    expect(response.status).toBe(201);
    expect(response.body.categoria).toBe("SERVIZI");
  });

  it("returns a codiceFornitore with FOR- prefix for SERVIZI supplier", async () => {
    const response = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("ADMIN", 1003))
      .send(
        buildFornitorePayload({
          nome: "Assistenza Roma",
          categoria: "SERVIZI",
          partitaIva: "98765432109",
          telefono: "0698765432",
          email: "supporto@assistenza.it",
          indirizzo: "Via Appia 22",
          cap: "00181",
          citta: "Roma",
          provincia: "RM",
        }),
      );

    expect(response.status).toBe(201);
    expect(response.body.codiceFornitore).toMatch(/^FOR-/);
  });
});

describe("AC-3 - partitaIva invalida", () => {
  it("returns 400 VALIDATION_ERROR with field partitaIva", async () => {
    const response = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("ADMIN", 1004))
      .send(buildFornitorePayload({ partitaIva: "123" }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.field).toBe("partitaIva");
  });

  it("returns explicit P.IVA validation message", async () => {
    const response = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("ADMIN", 1005))
      .send(buildFornitorePayload({ partitaIva: "123" }));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("P.IVA must be 11 digits");
    expect(response.body.id).toBeUndefined();
  });
});

describe("AC-4 - partitaIva duplicata", () => {
  it("returns 409 PARTITA_IVA_EXISTS for duplicate partitaIva", async () => {
    await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("ADMIN", 1006))
      .send(buildFornitorePayload({ partitaIva: "11111111111", email: "uno@ricambi.it" }));

    const duplicateResponse = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("ADMIN", 1007))
      .send(buildFornitorePayload({ partitaIva: "11111111111", email: "due@ricambi.it" }));

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe("PARTITA_IVA_EXISTS");
  });

  it("does not return a created id for duplicate request", async () => {
    const firstResponse = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("ADMIN", 1008))
      .send(buildFornitorePayload({ partitaIva: "11111111111", email: "primo@ricambi.it" }));

    const secondResponse = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("ADMIN", 1009))
      .send(buildFornitorePayload({ partitaIva: "11111111111", email: "secondo@ricambi.it" }));

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.id).toBeUndefined();
  });
});

describe("AC-5 - Tecnico non autorizzato", () => {
  it("returns 403 FORBIDDEN for TECNICO on POST /api/fornitori", async () => {
    const response = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("TECNICO", 2000))
      .send(buildFornitorePayload());

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(response.body.error.message).toBe("Accesso negato");
  });

  it("does not expose created supplier fields on forbidden response", async () => {
    const response = await request(app)
      .post("/api/fornitori")
      .set("Authorization", authHeader("TECNICO", 2001))
      .send(buildFornitorePayload());

    expect(response.status).toBe(403);
    expect(response.body.id).toBeUndefined();
    expect(response.body.codiceFornitore).toBeUndefined();
  });
});
