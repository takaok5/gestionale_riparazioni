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

function buildArticoloPayload(overrides?: Partial<Record<string, unknown>>) {
  return {
    codiceArticolo: "LCD-SAMS21",
    nome: "Display Samsung S21",
    descrizione: "LCD originale",
    categoria: "DISPLAY",
    fornitoreId: 3,
    prezzoAcquisto: 100,
    prezzoVendita: 150,
    sogliaMinima: 5,
    ...overrides,
  };
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Creazione articolo con giacenza iniziale", () => {
  it("Tests AC-1: Given ADMIN and full payload When POST /api/articoli Then 201", async () => {
    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1100))
      .send(buildArticoloPayload());

    expect(response.status).toBe(201);
    expect(response.body.id).toEqual(expect.any(Number));
  });

  it("Tests AC-1: Given successful creation When reading response Then codiceArticolo and giacenza are expected", async () => {
    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1101))
      .send(buildArticoloPayload());

    expect(response.status).toBe(201);
    expect(response.body.codiceArticolo).toBe("LCD-SAMS21");
    expect(response.body.giacenza).toBe(0);
  });
});

describe("AC-2 - Duplicato codice articolo", () => {
  it("Tests AC-2: Given existing codiceArticolo When POST duplicate Then 409 CODICE_ARTICOLO_EXISTS", async () => {
    await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1200))
      .send(buildArticoloPayload());

    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1201))
      .send(buildArticoloPayload());

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CODICE_ARTICOLO_EXISTS");
  });

  it("Tests AC-2: Given duplicate create When API rejects Then message is explicit and id is absent", async () => {
    await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1202))
      .send(buildArticoloPayload());

    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1203))
      .send(buildArticoloPayload());

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe("Codice articolo gia esistente");
    expect(response.body.id).toBeUndefined();
  });

  it("Tests AC-2: Given codice exists in uppercase When duplicate arrives in lowercase Then API still returns 409", async () => {
    await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1204))
      .send(buildArticoloPayload({ codiceArticolo: "LCD-SAMS21" }));

    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1205))
      .send(buildArticoloPayload({ codiceArticolo: "lcd-sams21" }));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CODICE_ARTICOLO_EXISTS");
  });
});

describe("AC-3 - Validazione prezzi", () => {
  it("Tests AC-3: Given prezzoVendita lower than prezzoAcquisto When POST /api/articoli Then 400 VALIDATION_ERROR", async () => {
    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1300))
      .send(buildArticoloPayload({ prezzoAcquisto: 100, prezzoVendita: 80 }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("Tests AC-3: Given invalid price relation When validation fails Then field and message are deterministic", async () => {
    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1301))
      .send(buildArticoloPayload({ prezzoAcquisto: 100, prezzoVendita: 80 }));

    expect(response.status).toBe(400);
    expect(response.body.error.details.field).toBe("prezzoVendita");
    expect(response.body.error.message).toBe(
      "prezzoVendita must be greater than prezzoAcquisto",
    );
  });
});

describe("AC-4 - Tecnico non autorizzato", () => {
  it("Tests AC-4: Given TECNICO When POST /api/articoli Then 403 FORBIDDEN", async () => {
    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("TECNICO", 1400))
      .send(buildArticoloPayload());

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("Tests AC-4: Given TECNICO forbidden response When checking payload Then message is Accesso negato", async () => {
    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("TECNICO", 1401))
      .send(buildArticoloPayload());

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe("Accesso negato");
  });
});

describe("AC-5 - Fornitore inesistente", () => {
  it("Tests AC-5: Given ADMIN and missing fornitoreId When POST /api/articoli Then 404 FORNITORE_NOT_FOUND", async () => {
    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1500))
      .send(buildArticoloPayload({ fornitoreId: 99999 }));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("FORNITORE_NOT_FOUND");
  });

  it("Tests AC-5: Given missing supplier When creation fails Then no created id is exposed", async () => {
    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 1501))
      .send(buildArticoloPayload({ fornitoreId: 99999 }));

    expect(response.status).toBe(404);
    expect(response.body.id).toBeUndefined();
  });
});
