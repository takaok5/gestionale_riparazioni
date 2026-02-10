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

async function createAziendaCliente(index: number, nome?: string) {
  return request(app)
    .post("/api/clienti")
    .set("Authorization", authHeader("COMMERCIALE", 2000 + index))
    .send({
      nome: nome ?? `Cliente ${index}`,
      ragioneSociale: `Azienda ${index}`,
      tipologia: "AZIENDA",
      partitaIva: String(10000000000 + index),
      email: `azienda-${index}@test.it`,
      indirizzo: `Via Roma ${index}`,
      cap: "20100",
      citta: "Milano",
      provincia: "MI",
    });
}

async function createPrivatoCliente(index: number, nome: string) {
  return request(app)
    .post("/api/clienti")
    .set("Authorization", authHeader("COMMERCIALE", 3000 + index))
    .send({
      nome,
      tipologia: "PRIVATO",
      codiceFiscale: "RSSMRA80A01H501U",
      email: `privato-${index}@test.it`,
      indirizzo: `Via Verdi ${index}`,
      cap: "00100",
      citta: "Roma",
      provincia: "RM",
    });
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Lista clienti paginata", () => {
  it("tests AC-1: should return 200 with data[10] and meta {page:1,limit:10,total:25,totalPages:3}", async () => {
    for (let i = 1; i <= 25; i += 1) {
      const seeded = await createAziendaCliente(i);
      expect(seeded.status).toBe(201);
    }

    const response = await request(app)
      .get("/api/clienti?page=1&limit=10")
      .set("Authorization", authHeader("COMMERCIALE", 5001));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(10);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(10);
    expect(response.body.meta.total).toBe(25);
    expect(response.body.meta.totalPages).toBe(3);
  });

  it("tests AC-1: should return records ordered by id asc on page 1", async () => {
    for (let i = 1; i <= 12; i += 1) {
      const seeded = await createAziendaCliente(i);
      expect(seeded.status).toBe(201);
    }

    const response = await request(app)
      .get("/api/clienti?page=1&limit=10")
      .set("Authorization", authHeader("COMMERCIALE", 5002));

    expect(response.status).toBe(200);
    expect(response.body.data[0].id).toBeLessThan(response.body.data[1].id);
    expect(response.body.meta.totalPages).toBe(2);
  });
});

describe("AC-2 - Ricerca clienti per nome o codiceCliente", () => {
  it("tests AC-2: should return only entries matching Rossi (case-insensitive) on nome/codiceCliente", async () => {
    const c1 = await createPrivatoCliente(1, "Mario Rossi");
    const c2 = await createAziendaCliente(2, "ROSSI SRL");
    const c3 = await createAziendaCliente(3, "Alfa Beta");

    expect(c1.status).toBe(201);
    expect(c2.status).toBe(201);
    expect(c3.status).toBe(201);

    const response = await request(app)
      .get("/api/clienti?search=Rossi")
      .set("Authorization", authHeader("COMMERCIALE", 5003));

    const rows = (response.body.data ?? []) as Array<{
      nome?: string;
      codiceCliente?: string;
    }>;

    expect(response.status).toBe(200);
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((row) =>
        (row.nome ?? "").toLowerCase().includes("rossi") ||
        (row.codiceCliente ?? "").toLowerCase().includes("rossi"),
      ),
    ).toBe(true);
  });

  it("tests AC-2: should exclude non-matching entries from search=Rossi", async () => {
    const c1 = await createAziendaCliente(10, "Rossi Gamma");
    const c2 = await createAziendaCliente(11, "Cliente Non Correlato");

    expect(c1.status).toBe(201);
    expect(c2.status).toBe(201);

    const response = await request(app)
      .get("/api/clienti?search=Rossi")
      .set("Authorization", authHeader("COMMERCIALE", 5004));

    const rows = (response.body.data ?? []) as Array<{ nome?: string }>;

    expect(response.status).toBe(200);
    expect(rows.some((row) => (row.nome ?? "").toLowerCase().includes("non correlato"))).toBe(false);
    expect(rows.some((row) => (row.nome ?? "").toLowerCase().includes("rossi"))).toBe(true);
  });
});

describe("AC-3 - Filtro clienti per tipologia", () => {
  it("tests AC-3: should return only tipologia=AZIENDA when filter is tipologia=AZIENDA", async () => {
    const privato = await createPrivatoCliente(20, "Privato Uno");
    const azienda1 = await createAziendaCliente(21, "Azienda Uno");
    const azienda2 = await createAziendaCliente(22, "Azienda Due");

    expect(privato.status).toBe(201);
    expect(azienda1.status).toBe(201);
    expect(azienda2.status).toBe(201);

    const response = await request(app)
      .get("/api/clienti?tipologia=AZIENDA")
      .set("Authorization", authHeader("COMMERCIALE", 5005));

    const rows = (response.body.data ?? []) as Array<{ tipologia?: string }>;

    expect(response.status).toBe(200);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.tipologia === "AZIENDA")).toBe(true);
  });

  it("tests AC-3: should not include PRIVATO entries in tipologia=AZIENDA result", async () => {
    const privato = await createPrivatoCliente(23, "Privato Due");
    const azienda = await createAziendaCliente(24, "Azienda Tre");

    expect(privato.status).toBe(201);
    expect(azienda.status).toBe(201);

    const response = await request(app)
      .get("/api/clienti?tipologia=AZIENDA")
      .set("Authorization", authHeader("COMMERCIALE", 5006));

    const rows = (response.body.data ?? []) as Array<{ tipologia?: string }>;

    expect(response.status).toBe(200);
    expect(rows.some((row) => row.tipologia === "PRIVATO")).toBe(false);
    expect(rows.some((row) => row.tipologia === "AZIENDA")).toBe(true);
  });
});

describe("AC-4 - Sad path filtro tipologia invalida", () => {
  it("tests AC-4: should return 400 VALIDATION_ERROR for tipologia=INVALID", async () => {
    const response = await request(app)
      .get("/api/clienti?tipologia=INVALID")
      .set("Authorization", authHeader("COMMERCIALE", 5007));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.field).toBe("tipologia");
  });

  it("tests AC-4: should report invalid_enum rule in validation details", async () => {
    const response = await request(app)
      .get("/api/clienti?tipologia=INVALID")
      .set("Authorization", authHeader("COMMERCIALE", 5008));

    expect(response.status).toBe(400);
    expect(response.body.error.details.field).toBe("tipologia");
    expect(response.body.error.details.rule).toBe("invalid_enum");
  });
});
