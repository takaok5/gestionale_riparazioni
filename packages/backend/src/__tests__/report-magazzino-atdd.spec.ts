import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

function buildArticoloPayload(index: number, overrides?: Partial<Record<string, unknown>>) {
  return {
    codiceArticolo: `REP-MAG-${String(index).padStart(4, "0")}`,
    nome: `Articolo Report ${index}`,
    descrizione: `Articolo report magazzino ${index}`,
    categoria: "DISPLAY",
    fornitoreId: 3,
    prezzoAcquisto: 50 + index,
    prezzoVendita: 100 + index,
    sogliaMinima: 5,
    ...overrides,
  };
}

async function createArticolo(index: number, adminUserId: number, overrides?: Partial<Record<string, unknown>>) {
  const payload = buildArticoloPayload(index, overrides);
  const response = await request(app)
    .post("/api/articoli")
    .set("Authorization", authHeader("ADMIN", adminUserId))
    .send(payload);

  expect(response.status).toBe(201);
  return {
    id: response.body.id as number,
    nome: payload.nome,
  };
}

async function addMovimento(
  articoloId: number,
  userId: number,
  payload: { tipo: "CARICO" | "SCARICO" | "RETTIFICA"; quantita: number; riferimento: string },
) {
  const response = await request(app)
    .post(`/api/articoli/${articoloId}/movimenti`)
    .set("Authorization", authHeader("TECNICO", userId))
    .send(payload);

  expect(response.status).toBe(201);
}

async function seedMagazzinoScenario(): Promise<void> {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-10T10:00:00.000Z"));

  for (let i = 1; i <= 4; i += 1) {
    await createArticolo(i, 6600 + i, { sogliaMinima: 0 });
  }

  const articoloTop = await createArticolo(5, 6601, { nome: "Display Samsung S21", sogliaMinima: 3 });
  const articoloZero = await createArticolo(6, 6602, { sogliaMinima: 2 });
  const articoloOther = await createArticolo(7, 6603, { sogliaMinima: 1 });

  await addMovimento(articoloTop.id, 6611, { tipo: "CARICO", quantita: 60, riferimento: "Ordine FOR-6601" });
  await addMovimento(articoloTop.id, 6612, { tipo: "SCARICO", quantita: 45, riferimento: "Riparazione RIP-6601" });

  await addMovimento(articoloZero.id, 6613, { tipo: "CARICO", quantita: 10, riferimento: "Ordine FOR-6602" });
  await addMovimento(articoloZero.id, 6614, { tipo: "SCARICO", quantita: 10, riferimento: "Riparazione RIP-6602" });

  await addMovimento(articoloOther.id, 6615, { tipo: "CARICO", quantita: 20, riferimento: "Ordine FOR-6603" });
  await addMovimento(articoloOther.id, 6616, { tipo: "SCARICO", quantita: 5, riferimento: "Riparazione RIP-6603" });
}

beforeEach(async () => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  await seedMagazzinoScenario();
  vi.useRealTimers();
});

describe("AC-1 - KPI report magazzino", () => {
  it("Tests AC-1: Given articoli with giacenze and prezzi When GET /api/report/magazzino Then returns 200 with KPI keys", async () => {
    const response = await request(app)
      .get("/api/report/magazzino")
      .set("Authorization", authHeader("ADMIN", 6620));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("valoreGiacenze");
    expect(response.body).toHaveProperty("articoliEsauriti");
    expect(response.body).toHaveProperty("articoliSottoSoglia");
    expect(response.body).toHaveProperty("topArticoliUtilizzati");
  });

  it("Tests AC-1: Given Display Samsung S21 with SCARICO 45 When report is returned Then top item includes articoloId=5 and quantitaUtilizzata=45", async () => {
    const response = await request(app)
      .get("/api/report/magazzino")
      .set("Authorization", authHeader("ADMIN", 6621));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.topArticoliUtilizzati)).toBe(true);
    expect(response.body.topArticoliUtilizzati[0]).toMatchObject({
      articoloId: 5,
      nome: "Display Samsung S21",
      quantitaUtilizzata: 45,
    });
  });
});

describe("AC-2 - Conteggio articoli esauriti", () => {
  it("Tests AC-2: Given articolo id=5 has giacenza 0 and sogliaMinima>0 When GET /api/report/magazzino Then articoliEsauriti is incremented", async () => {
    const response = await request(app)
      .get("/api/report/magazzino")
      .set("Authorization", authHeader("ADMIN", 6622));

    expect(response.status).toBe(200);
    expect(response.body.articoliEsauriti).toBe(1);
  });

  it("Tests AC-2: Given one seeded zero-stock articolo When report is returned Then articoliSottoSoglia is at least articoliEsauriti", async () => {
    const response = await request(app)
      .get("/api/report/magazzino")
      .set("Authorization", authHeader("ADMIN", 6623));

    expect(response.status).toBe(200);
    expect(response.body.articoliSottoSoglia).toBeGreaterThanOrEqual(response.body.articoliEsauriti);
  });
});

describe("AC-3 - Top utilizzo da movimenti SCARICO", () => {
  it("Tests AC-3: Given SCARICO movimenti in last 30 days When GET /api/report/magazzino Then topArticoliUtilizzati returns at most 10 entries", async () => {
    const response = await request(app)
      .get("/api/report/magazzino")
      .set("Authorization", authHeader("ADMIN", 6624));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.topArticoliUtilizzati)).toBe(true);
    expect(response.body.topArticoliUtilizzati.length).toBeLessThanOrEqual(10);
  });

  it("Tests AC-3: Given multiple SCARICO totals When report is returned Then rows are ordered by quantitaUtilizzata desc", async () => {
    const response = await request(app)
      .get("/api/report/magazzino")
      .set("Authorization", authHeader("ADMIN", 6625));

    expect(response.status).toBe(200);
    expect(response.body.topArticoliUtilizzati[0].quantitaUtilizzata).toBeGreaterThanOrEqual(
      response.body.topArticoliUtilizzati[1].quantitaUtilizzata,
    );
  });
});

describe("AC-4 - Endpoint admin only", () => {
  it("Tests AC-4: Given role TECNICO When GET /api/report/magazzino Then returns 403 FORBIDDEN with Admin only message", async () => {
    const response = await request(app)
      .get("/api/report/magazzino")
      .set("Authorization", authHeader("TECNICO", 6626));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: "FORBIDDEN", message: "Admin only" },
    });
  });

  it("Tests AC-4: Given forbidden response When role is TECNICO Then inventory KPI fields are not exposed", async () => {
    const response = await request(app)
      .get("/api/report/magazzino")
      .set("Authorization", authHeader("TECNICO", 6627));

    expect(response.status).toBe(403);
    expect(response.body).not.toHaveProperty("valoreGiacenze");
    expect(response.body).not.toHaveProperty("topArticoliUtilizzati");
  });
});
