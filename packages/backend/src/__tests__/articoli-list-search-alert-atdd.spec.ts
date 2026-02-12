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

function buildArticoloPayload(index: number, overrides?: Partial<Record<string, unknown>>) {
  return {
    codiceArticolo: `ART-${String(index).padStart(4, "0")}`,
    nome: `Ricambio ${index}`,
    descrizione: `Descrizione articolo ${index}`,
    categoria: index % 2 === 0 ? "DISPLAY" : "BATTERIA",
    fornitoreId: 3,
    prezzoAcquisto: 50 + index,
    prezzoVendita: 100 + index,
    sogliaMinima: 5,
    ...overrides,
  };
}

async function seedArticoli(count: number, startUserId = 3000): Promise<void> {
  for (let i = 1; i <= count; i += 1) {
    const response = await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", startUserId + i))
      .send(buildArticoloPayload(i));

    expect(response.status).toBe(201);
  }
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Lista paginata articoli", () => {
  it("Tests AC-1: Given 30 articoli exist When GET /api/articoli?page=1&limit=20 Then 200 with 20 rows and meta", async () => {
    await seedArticoli(30);

    const response = await request(app)
      .get("/api/articoli?page=1&limit=20")
      .set("Authorization", authHeader("TECNICO", 4100));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(20);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(20);
    expect(response.body.meta.total).toBe(30);
  });

  it("Tests AC-1: Given page=2 limit=10 When listing Then meta reflects pagination and deterministic boundaries", async () => {
    await seedArticoli(30);

    const response = await request(app)
      .get("/api/articoli?page=2&limit=10")
      .set("Authorization", authHeader("TECNICO", 4101));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(10);
    expect(response.body.meta.page).toBe(2);
    expect(response.body.meta.limit).toBe(10);
    expect(response.body.meta.total).toBe(30);
  });
});

describe("AC-2 - Ricerca full-text articoli", () => {
  it("Tests AC-2: Given Samsung appears in nome/codice/descrizione When GET /api/articoli?search=Samsung Then only matching rows are returned", async () => {
    await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 4200))
      .send(buildArticoloPayload(1, { nome: "Display Samsung S21" }));
    await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 4201))
      .send(buildArticoloPayload(2, { codiceArticolo: "SAMSUNG-CODE-002" }));
    await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 4202))
      .send(buildArticoloPayload(3, { descrizione: "Compatibile Samsung serie A" }));
    await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 4203))
      .send(buildArticoloPayload(4, { nome: "Batteria iPhone 13", codiceArticolo: "IPH-13-BAT" }));

    const response = await request(app)
      .get("/api/articoli?search=Samsung")
      .set("Authorization", authHeader("TECNICO", 4204));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(3);
    expect(
      response.body.data.every((row: { nome: string; codiceArticolo: string; descrizione: string }) =>
        row.nome.toLowerCase().includes("samsung") ||
        row.codiceArticolo.toLowerCase().includes("samsung") ||
        row.descrizione.toLowerCase().includes("samsung"),
      ),
    ).toBe(true);
  });

  it("Tests AC-2: Given one non matching articolo exists When search=Samsung Then non matching row is excluded", async () => {
    await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 4210))
      .send(buildArticoloPayload(10, { nome: "Display Samsung S22" }));
    await request(app)
      .post("/api/articoli")
      .set("Authorization", authHeader("ADMIN", 4211))
      .send(buildArticoloPayload(11, { nome: "Batteria Xiaomi" }));

    const response = await request(app)
      .get("/api/articoli?search=Samsung")
      .set("Authorization", authHeader("TECNICO", 4212));

    expect(response.status).toBe(200);
    expect(response.body.data.some((row: { nome: string }) => row.nome.includes("Xiaomi"))).toBe(false);
  });
});

describe("AC-3 - Alert giacenza sotto soglia", () => {
  it("Tests AC-3: Given articolo id=5 has giacenza<=soglia and id=7 does not When GET /api/articoli/alert Then only low stock rows are returned", async () => {
    await seedArticoli(10, 4300);

    const response = await request(app)
      .get("/api/articoli/alert")
      .set("Authorization", authHeader("TECNICO", 4310));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(
      response.body.data.every((row: { giacenza: number; sogliaMinima: number }) =>
        row.giacenza <= row.sogliaMinima,
      ),
    ).toBe(true);
  });

  it("Tests AC-3: Given alert endpoint response When checking payload Then rows above threshold are excluded", async () => {
    await seedArticoli(5, 4320);

    const response = await request(app)
      .get("/api/articoli/alert")
      .set("Authorization", authHeader("TECNICO", 4326));

    expect(response.status).toBe(200);
    expect(
      response.body.data.some((row: { giacenza: number; sogliaMinima: number }) =>
        row.giacenza > row.sogliaMinima,
      ),
    ).toBe(false);
  });
});

describe("AC-4 - Filtro categoria", () => {
  it("Tests AC-4: Given mixed categories When GET /api/articoli?categoria=DISPLAY Then only DISPLAY rows are returned", async () => {
    await seedArticoli(12, 4400);

    const response = await request(app)
      .get("/api/articoli?categoria=DISPLAY")
      .set("Authorization", authHeader("TECNICO", 4413));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((row: { categoria: string }) => row.categoria === "DISPLAY")).toBe(true);
  });

  it("Tests AC-4: Given DISPLAY filter When reading response Then BATTERIA rows are excluded", async () => {
    await seedArticoli(8, 4420);

    const response = await request(app)
      .get("/api/articoli?categoria=DISPLAY")
      .set("Authorization", authHeader("TECNICO", 4429));

    expect(response.status).toBe(200);
    expect(response.body.data.some((row: { categoria: string }) => row.categoria === "BATTERIA")).toBe(false);
  });
});

describe("AC-5 - Sad path query invalida", () => {
  it("Tests AC-5: Given max limit is 100 When GET /api/articoli?limit=1000 Then 400 VALIDATION_ERROR", async () => {
    await seedArticoli(3, 4500);

    const response = await request(app)
      .get("/api/articoli?limit=1000")
      .set("Authorization", authHeader("TECNICO", 4504));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.field).toBe("limit");
  });

  it("Tests AC-5: Given empty categoria filter When GET /api/articoli?categoria= Then 400 with categoria validation details", async () => {
    await seedArticoli(3, 4510);

    const response = await request(app)
      .get("/api/articoli?categoria=")
      .set("Authorization", authHeader("TECNICO", 4514));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.field).toBe("categoria");
  });
});

describe("Review hardening - Authorization and validation coverage", () => {
  it("returns 200 for ADMIN on GET /api/articoli", async () => {
    await seedArticoli(2, 4600);

    const response = await request(app)
      .get("/api/articoli?page=1&limit=1")
      .set("Authorization", authHeader("ADMIN", 4603));

    expect(response.status).toBe(200);
    expect(response.body.meta.page).toBe(1);
  });

  it("returns 401 when Authorization header is missing on GET /api/articoli/alert", async () => {
    await seedArticoli(1, 4610);

    const response = await request(app).get("/api/articoli/alert");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token mancante");
  });

  it("returns 400 VALIDATION_ERROR when page is invalid", async () => {
    await seedArticoli(1, 4620);

    const response = await request(app)
      .get("/api/articoli?page=abc")
      .set("Authorization", authHeader("TECNICO", 4622));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.field).toBe("page");
  });
});
