import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import {
  resetAnagraficheStoreForTests,
  seedFornitoreDetailScenarioForTests,
} from "../services/anagrafiche-service.js";
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

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  seedFornitoreDetailScenarioForTests();
});

describe("AC-1 - Dettaglio fornitore esistente", () => {
  it("Tests AC-1: Given ADMIN and fornitore id=3 exists When GET /api/fornitori/3 Then 200 with full supplier payload", async () => {
    const response = await request(app)
      .get("/api/fornitori/3")
      .set("Authorization", authHeader("ADMIN", 8101));

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(3);
    expect(response.body?.data?.codiceFornitore).toBe("FOR-000003");
  });

  it("Tests AC-1: Given ADMIN and fornitore id=3 exists When GET /api/fornitori/3 Then payload exposes the required anagrafica fields", async () => {
    const response = await request(app)
      .get("/api/fornitori/3")
      .set("Authorization", authHeader("ADMIN", 8102));

    expect(response.status).toBe(200);
    expect(response.body?.data).toEqual(
      expect.objectContaining({
        id: 3,
        codiceFornitore: expect.any(String),
        nome: expect.any(String),
        categoria: expect.any(String),
        partitaIva: expect.any(String),
        indirizzo: expect.any(String),
        citta: expect.any(String),
        cap: expect.any(String),
        provincia: expect.any(String),
        telefono: expect.any(String),
        email: expect.any(String),
      }),
    );
  });
});

describe("AC-2 - Modifica fornitore", () => {
  it("Tests AC-2: Given ADMIN and fornitore id=3 exists When PUT /api/fornitori/3 with telefono+categoria Then 200 with updated fields", async () => {
    const response = await request(app)
      .put("/api/fornitori/3")
      .set("Authorization", authHeader("ADMIN", 8201))
      .send({ telefono: "0687654321", categoria: "ALTRO" });

    expect(response.status).toBe(200);
    expect(response.body?.id).toBe(3);
    expect(response.body?.telefono).toBe("0687654321");
    expect(response.body?.categoria).toBe("ALTRO");
  });

  it("Tests AC-2: Given update success When GET /api/fornitori/3 Then persisted telefono/categoria are returned", async () => {
    await request(app)
      .put("/api/fornitori/3")
      .set("Authorization", authHeader("ADMIN", 8202))
      .send({ telefono: "0687654321", categoria: "ALTRO" });

    const response = await request(app)
      .get("/api/fornitori/3")
      .set("Authorization", authHeader("ADMIN", 8203));

    expect(response.status).toBe(200);
    expect(response.body?.data?.telefono).toBe("0687654321");
    expect(response.body?.data?.categoria).toBe("ALTRO");
  });
});

describe("AC-3 - Lista ordini fornitore", () => {
  it("Tests AC-3: Given fornitore id=3 has 5 ordini When GET /api/fornitori/3/ordini Then 200 with array length 5", async () => {
    const response = await request(app)
      .get("/api/fornitori/3/ordini")
      .set("Authorization", authHeader("ADMIN", 8301));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data)).toBe(true);
    expect(response.body?.data).toHaveLength(5);
  });

  it("Tests AC-3: Given fornitore id=3 has ordini When GET /api/fornitori/3/ordini Then each row has projection {id, numeroOrdine, stato, dataOrdine, totale}", async () => {
    const response = await request(app)
      .get("/api/fornitori/3/ordini")
      .set("Authorization", authHeader("ADMIN", 8302));

    expect(response.status).toBe(200);
    const rows = (response.body?.data ?? []) as Array<Record<string, unknown>>;
    expect(rows.length).toBe(5);
    for (const row of rows) {
      expect(row).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          numeroOrdine: expect.any(String),
          stato: expect.any(String),
          dataOrdine: expect.any(String),
          totale: expect.any(Number),
        }),
      );
    }
  });
});

describe("AC-4 - Tecnico non autorizzato a modifica fornitore", () => {
  it("Tests AC-4: Given TECNICO When PUT /api/fornitori/3 with telefono+categoria Then 403 FORBIDDEN", async () => {
    const response = await request(app)
      .put("/api/fornitori/3")
      .set("Authorization", authHeader("TECNICO", 8401))
      .send({ telefono: "0687654321", categoria: "ALTRO" });

    expect(response.status).toBe(403);
    expect(response.body?.error?.code).toBe("FORBIDDEN");
    expect(response.body?.error?.message).toBe("Accesso negato");
  });

  it("Tests AC-4: Given TECNICO forbidden on PUT /api/fornitori/3 Then response does not expose supplier data payload", async () => {
    const response = await request(app)
      .put("/api/fornitori/3")
      .set("Authorization", authHeader("TECNICO", 8402))
      .send({ telefono: "0687654321", categoria: "ALTRO" });

    expect(response.status).toBe(403);
    expect(response.body?.data).toBeUndefined();
    expect(response.body?.id).toBeUndefined();
  });
});
