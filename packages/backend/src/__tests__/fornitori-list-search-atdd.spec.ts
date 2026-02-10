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

function authHeader(role: Role, userId = 6000): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildFornitorePayload(index: number, overrides?: Partial<Record<string, unknown>>) {
  return {
    nome: `Fornitore ${index}`,
    categoria: "RICAMBI",
    partitaIva: String(20000000000 + index),
    telefono: `06${String(20000000 + index).padStart(8, "0")}`,
    email: `fornitore-${index}@test.it`,
    indirizzo: `Via Test ${index}`,
    cap: "20100",
    citta: "Milano",
    provincia: "MI",
    ...overrides,
  };
}

async function createFornitore(index: number, overrides?: Partial<Record<string, unknown>>) {
  return request(app)
    .post("/api/fornitori")
    .set("Authorization", authHeader("ADMIN", 6100 + index))
    .send(buildFornitorePayload(index, overrides));
}

async function getCurrentFornitoriTotal(userId: number): Promise<number> {
  const response = await request(app)
    .get("/api/fornitori?page=1&limit=1")
    .set("Authorization", authHeader("ADMIN", userId));

  expect(response.status).toBe(200);
  return Number(response.body?.meta?.total ?? 0);
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Lista fornitori paginata", () => {
  it("tests AC-1: should return 200 with 15 fornitori and meta {page:1,limit:20,total:15,totalPages:1}", async () => {
    const targetTotal = 15;
    const baselineTotal = await getCurrentFornitoriTotal(6201);
    expect(baselineTotal).toBeLessThanOrEqual(targetTotal);

    const toSeed = targetTotal - baselineTotal;
    for (let i = 1; i <= toSeed; i += 1) {
      const seeded = await createFornitore(i);
      expect(seeded.status).toBe(201);
    }

    const response = await request(app)
      .get("/api/fornitori?page=1&limit=20")
      .set("Authorization", authHeader("ADMIN", 6202));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(15);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(20);
    expect(response.body.meta.total).toBe(15);
    expect(response.body.meta.totalPages).toBe(1);
  });

  it("tests AC-1: should return fornitori ordered by id asc", async () => {
    const first = await createFornitore(6501, {
      nome: "Ordinamento Uno",
      partitaIva: "23000000001",
      email: "ordinamento-uno@test.it",
    });
    const second = await createFornitore(6502, {
      nome: "Ordinamento Due",
      partitaIva: "23000000002",
      email: "ordinamento-due@test.it",
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const response = await request(app)
      .get("/api/fornitori?page=1&limit=20")
      .set("Authorization", authHeader("ADMIN", 6203));

    const rows = (response.body.data ?? []) as Array<{ id: number }>;

    expect(response.status).toBe(200);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0].id).toBeLessThan(rows[1].id);
  });
});

describe("AC-2 - Filtro categoria fornitori", () => {
  it("tests AC-2: should return only categoria=RICAMBI when filter categoria=RICAMBI", async () => {
    const ricambi = await createFornitore(7001, {
      nome: "Ricambi Nord",
      categoria: "RICAMBI",
      partitaIva: "21000000001",
      email: "ricambi-nord@test.it",
    });

    const servizi = await createFornitore(7002, {
      nome: "Servizi Centro",
      categoria: "SERVIZI",
      partitaIva: "21000000002",
      email: "servizi-centro@test.it",
    });

    expect(ricambi.status).toBe(201);
    expect(servizi.status).toBe(201);

    const response = await request(app)
      .get("/api/fornitori?categoria=RICAMBI")
      .set("Authorization", authHeader("ADMIN", 6204));

    const rows = (response.body.data ?? []) as Array<{ categoria?: string }>;

    expect(response.status).toBe(200);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.categoria === "RICAMBI")).toBe(true);
  });

  it("tests AC-2: should exclude categoria=SERVIZI from categoria=RICAMBI results", async () => {
    const response = await request(app)
      .get("/api/fornitori?categoria=RICAMBI")
      .set("Authorization", authHeader("ADMIN", 6205));

    const rows = (response.body.data ?? []) as Array<{ categoria?: string }>;

    expect(response.status).toBe(200);
    expect(rows.some((row) => row.categoria === "SERVIZI")).toBe(false);
  });
});

describe("AC-3 - Ricerca fornitori su nome o codiceFornitore", () => {
  it("tests AC-3: should return only entries matching SRL in nome/codiceFornitore", async () => {
    const srl1 = await createFornitore(8001, {
      nome: "Ricambi SRL Nord",
      partitaIva: "22000000001",
      email: "srl-nord@test.it",
    });

    const srl2 = await createFornitore(8002, {
      nome: "Officina SRL Delta",
      partitaIva: "22000000002",
      email: "srl-delta@test.it",
    });

    const nonMatch = await createFornitore(8003, {
      nome: "Laboratorio Alfa",
      partitaIva: "22000000003",
      email: "alfa@test.it",
    });

    expect(srl1.status).toBe(201);
    expect(srl2.status).toBe(201);
    expect(nonMatch.status).toBe(201);

    const response = await request(app)
      .get("/api/fornitori?search=SRL")
      .set("Authorization", authHeader("ADMIN", 6206));

    const rows = (response.body.data ?? []) as Array<{
      nome?: string;
      codiceFornitore?: string;
    }>;

    expect(response.status).toBe(200);
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((row) => {
        const nome = (row.nome ?? "").toLowerCase();
        const codice = (row.codiceFornitore ?? "").toLowerCase();
        return nome.includes("srl") || codice.includes("srl");
      }),
    ).toBe(true);
  });

  it("tests AC-3: should exclude non-matching suppliers from search=SRL", async () => {
    const srl = await createFornitore(8101, {
      nome: "Tecnologia SRL",
      partitaIva: "24000000001",
      email: "tecnologia-srl@test.it",
    });
    const nonMatch = await createFornitore(8102, {
      nome: "Laboratorio Alfa",
      partitaIva: "24000000002",
      email: "laboratorio-alfa@test.it",
    });

    expect(srl.status).toBe(201);
    expect(nonMatch.status).toBe(201);

    const response = await request(app)
      .get("/api/fornitori?search=SRL")
      .set("Authorization", authHeader("ADMIN", 6207));

    const rows = (response.body.data ?? []) as Array<{ nome?: string }>;

    expect(response.status).toBe(200);
    expect(rows.some((row) => (row.nome ?? "").toLowerCase().includes("laboratorio alfa"))).toBe(false);
    expect(rows.some((row) => (row.nome ?? "").toLowerCase().includes("srl"))).toBe(true);
  });
});

describe("AC-4 - Sad path limite invalido", () => {
  it("tests AC-4: should return 400 VALIDATION_ERROR for limit=1000", async () => {
    const response = await request(app)
      .get("/api/fornitori?limit=1000")
      .set("Authorization", authHeader("ADMIN", 6208));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.field).toBe("limit");
  });

  it("tests AC-4: should report too_large rule for limit above max", async () => {
    const response = await request(app)
      .get("/api/fornitori?limit=1000")
      .set("Authorization", authHeader("ADMIN", 6209));

    expect(response.status).toBe(400);
    expect(response.body.error.details.field).toBe("limit");
    expect(response.body.error.details.rule).toBe("too_large");
  });
});
