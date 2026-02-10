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

function adminAuthHeader(): string {
  return `Bearer ${buildAccessToken({ userId: 1000, role: "ADMIN" })}`;
}

function tecnicoAuthHeader(): string {
  return `Bearer ${buildAccessToken({ userId: 1, role: "TECNICO" })}`;
}

const clientePayload = {
  nome: "Mario",
  cognome: "Rossi",
  ragioneSociale: "Rossi SRL",
  tipologia: "azienda",
  indirizzo: "Via Roma 1",
  citta: "Milano",
  cap: "20100",
  provincia: "MI",
  codiceCliente: "CL0000001",
};

const fornitoreUpdatePayload = {
  ragioneSociale: "Ricambi Nord Srl",
  telefono: "0299988877",
};

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Audit CREATE su Cliente", () => {
  it("returns 201 on POST /api/clienti and exposes created id", async () => {
    const createResponse = await request(app)
      .post("/api/clienti")
      .set("Authorization", adminAuthHeader())
      .send(clientePayload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.id).toEqual(expect.any(Number));
    expect(createResponse.body.id).toBeGreaterThan(0);
  });

  it("creates audit entry with userId/action/modelName/objectId/timestamp", async () => {
    const createResponse = await request(app)
      .post("/api/clienti")
      .set("Authorization", adminAuthHeader())
      .send(clientePayload);

    const auditResponse = await request(app)
      .get("/api/audit-log?modelName=Cliente&page=1")
      .set("Authorization", adminAuthHeader());

    const createdId = createResponse.body.id as number;
    const rows = (auditResponse.body.results ?? []) as Array<{
      userId?: number;
      action?: string;
      modelName?: string;
      objectId?: string;
      timestamp?: string;
    }>;
    const row = rows.find((item) => item.objectId === String(createdId));

    expect(auditResponse.status).toBe(200);
    expect(row?.userId).toBe(1000);
    expect(row?.action).toBe("CREATE");
    expect(row?.modelName).toBe("Cliente");
    expect(row?.objectId).toBe(String(createdId));
    expect(row?.timestamp).toEqual(expect.any(String));
  });
});

describe("AC-2 - Audit UPDATE su Fornitore", () => {
  it("returns 200 on PUT /api/fornitori/5", async () => {
    const response = await request(app)
      .put("/api/fornitori/5")
      .set("Authorization", adminAuthHeader())
      .send(fornitoreUpdatePayload);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(5);
    expect(response.body.ragioneSociale).toBe("Ricambi Nord Srl");
  });

  it("writes UPDATE audit with old/new details for fornitore id=5", async () => {
    await request(app)
      .put("/api/fornitori/5")
      .set("Authorization", adminAuthHeader())
      .send(fornitoreUpdatePayload);

    const auditResponse = await request(app)
      .get("/api/audit-log?modelName=Fornitore&page=1")
      .set("Authorization", adminAuthHeader());

    const rows = (auditResponse.body.results ?? []) as Array<{
      action?: string;
      objectId?: string;
      dettagli?: {
        old?: { ragioneSociale?: string; telefono?: string };
        new?: { ragioneSociale?: string; telefono?: string };
      };
    }>;
    const row = rows.find((item) => item.objectId === "5" && item.action === "UPDATE");

    expect(auditResponse.status).toBe(200);
    expect(row?.action).toBe("UPDATE");
    expect(row?.objectId).toBe("5");
    expect(row?.dettagli?.old?.ragioneSociale).toBe("Ricambi Nord");
    expect(row?.dettagli?.new?.ragioneSociale).toBe("Ricambi Nord Srl");
    expect(row?.dettagli?.old?.telefono).toBe("0211122233");
    expect(row?.dettagli?.new?.telefono).toBe("0299988877");
  });
});

describe("AC-3 - Filtro e paginazione audit log", () => {
  it("returns 200 with results + pagination on GET /api/audit-log?modelName=Cliente&page=1", async () => {
    const response = await request(app)
      .get("/api/audit-log?modelName=Cliente&page=1")
      .set("Authorization", adminAuthHeader());

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.pageSize).toBe(10);
  });

  it("returns only modelName=Cliente entries and at most 10 results", async () => {
    const response = await request(app)
      .get("/api/audit-log?modelName=Cliente&page=1")
      .set("Authorization", adminAuthHeader());

    const rows = (response.body.results ?? []) as Array<{ modelName?: string }>;
    const allCliente = rows.every((row) => row.modelName === "Cliente");

    expect(response.status).toBe(200);
    expect(allCliente).toBe(true);
    expect(rows.length).toBeLessThanOrEqual(10);
  });
});

describe("AC-4 - Accesso audit log negato a TECNICO", () => {
  it("returns 403 FORBIDDEN payload for TECNICO on GET /api/audit-log", async () => {
    const response = await request(app)
      .get("/api/audit-log")
      .set("Authorization", tecnicoAuthHeader());

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(response.body.error.message).toBe("Accesso negato");
  });

  it("does not expose audit records in forbidden response", async () => {
    const response = await request(app)
      .get("/api/audit-log")
      .set("Authorization", tecnicoAuthHeader());

    expect(response.status).toBe(403);
    expect(response.body.results).toBeUndefined();
    expect(response.body.data).toBeUndefined();
  });
});
