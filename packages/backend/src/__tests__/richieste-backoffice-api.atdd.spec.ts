import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetRateLimiter } from "../services/login-rate-limit.js";
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

async function seedPublicRichieste(count = 30): Promise<void> {
  for (let i = 1; i <= count; i += 1) {
    const response = await request(app).post("/api/public/richieste").send({
      tipo: "PREVENTIVO",
      nome: `Lead ${i}`,
      email: `lead-${i}@test.it`,
      problema: `Display rotto ${i}`,
      consensoPrivacy: true,
    });

    expect(response.status).toBe(201);
    expect(typeof response.body?.data?.ticketId).toBe("string");
  }
}

beforeEach(() => {
  process.env.NODE_ENV = "test";
  resetRateLimiter();
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - GET /api/richieste paginata", () => {
  it("Tests AC-1: Given there are 30 public requests persisted with fields stato, tipo, contatto, createdAt When a Commerciale or Admin calls GET /api/richieste?page=1&limit=20 Then the API responds with HTTP 200, response.body.data contains exactly 20 items with stato, tipo, contatto, createdAt, and response.body.pagination is { page: 1, pageSize: 20, totalItems: 30, totalPages: 2 }", async () => {
    await seedPublicRichieste(30);

    const response = await request(app)
      .get("/api/richieste?page=1&limit=20")
      .set("Authorization", authHeader("COMMERCIALE", 5001));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data)).toBe(true);
    expect(response.body?.data).toHaveLength(20);
  });

  it("Tests AC-1: Given there are 30 public requests persisted with fields stato, tipo, contatto, createdAt When a Commerciale or Admin calls GET /api/richieste?page=1&limit=20 Then pagination reports page=1 pageSize=20 totalItems=30 totalPages=2 and first item exposes stato/tipo/contatto/createdAt", async () => {
    await seedPublicRichieste(30);

    const response = await request(app)
      .get("/api/richieste?page=1&limit=20")
      .set("Authorization", authHeader("ADMIN", 1000));

    expect(response.status).toBe(200);
    expect(response.body?.pagination?.page).toBe(1);
    expect(response.body?.pagination?.pageSize).toBe(20);
    expect(response.body?.pagination?.totalItems).toBe(30);
    expect(response.body?.pagination?.totalPages).toBe(2);
    expect(response.body?.data?.[0]).toEqual(
      expect.objectContaining({
        stato: expect.any(String),
        tipo: expect.any(String),
        contatto: expect.anything(),
        createdAt: expect.any(String),
      }),
    );
  });
});

describe("AC-2 - PATCH /api/richieste/:id/stato con audit", () => {
  it("Tests AC-2: Given richiesta id=12 exists with stato=\"NUOVA\" and actor user is authenticated with role COMMERCIALE or ADMIN When the actor calls PATCH /api/richieste/12/stato with body { stato: \"IN_LAVORAZIONE\" } Then the API responds with HTTP 200 and richiesta id=12 becomes IN_LAVORAZIONE", async () => {
    await seedPublicRichieste(30);

    const response = await request(app)
      .patch("/api/richieste/12/stato")
      .set("Authorization", authHeader("COMMERCIALE", 5001))
      .send({ stato: "IN_LAVORAZIONE" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(12);
    expect(response.body?.data?.stato).toBe("IN_LAVORAZIONE");
  });

  it("Tests AC-2: Given richiesta id=12 exists with stato=\"NUOVA\" and actor user is authenticated with role COMMERCIALE or ADMIN When stato transition to IN_LAVORAZIONE is requested Then GET /api/audit-log?modelName=RichiestaPubblica&page=1 returns at least one row with objectId=12 and dettagli.old.stato=NUOVA dettagli.new.stato=IN_LAVORAZIONE", async () => {
    await seedPublicRichieste(30);

    const patchResponse = await request(app)
      .patch("/api/richieste/12/stato")
      .set("Authorization", authHeader("ADMIN", 1000))
      .send({ stato: "IN_LAVORAZIONE" });

    expect(patchResponse.status).toBe(200);

    const auditResponse = await request(app)
      .get("/api/audit-log?modelName=RichiestaPubblica&page=1")
      .set("Authorization", authHeader("ADMIN", 1000));

    const rows = (auditResponse.body?.results ?? []) as Array<{
      objectId?: string;
      dettagli?: { old?: { stato?: string }; new?: { stato?: string } };
    }>;
    const row = rows.find((item) => item.objectId === "12");

    expect(auditResponse.status).toBe(200);
    expect(row?.dettagli?.old?.stato).toBe("NUOVA");
    expect(row?.dettagli?.new?.stato).toBe("IN_LAVORAZIONE");
  });
});

describe("AC-3 - PATCH /api/richieste/:id/assegna", () => {
  it("Tests AC-3: Given authenticated user has role COMMERCIALE, userId=5001, and richiesta id=12 is currently unassigned When the user calls PATCH /api/richieste/12/assegna with body { commercialeId: 5001 } Then the API responds with HTTP 200, response.body.data.id=12, and response.body.data.assegnataAUserId=5001", async () => {
    await seedPublicRichieste(30);

    const response = await request(app)
      .patch("/api/richieste/12/assegna")
      .set("Authorization", authHeader("COMMERCIALE", 5001))
      .send({ commercialeId: 5001 });

    expect(response.status).toBe(200);
    expect(response.body?.data?.id).toBe(12);
    expect(response.body?.data?.assegnataAUserId).toBe("5001");
  });

  it("Tests AC-3: Given authenticated user has role COMMERCIALE, userId=5001, and richiesta id=12 is currently unassigned When assignment succeeds Then a subsequent GET /api/richieste?page=1&limit=20 contains richiesta id=12 with assegnataAUserId=5001", async () => {
    await seedPublicRichieste(30);

    const assignResponse = await request(app)
      .patch("/api/richieste/12/assegna")
      .set("Authorization", authHeader("COMMERCIALE", 5001))
      .send({ commercialeId: 5001 });

    expect(assignResponse.status).toBe(200);

    const listResponse = await request(app)
      .get("/api/richieste?page=1&limit=20")
      .set("Authorization", authHeader("COMMERCIALE", 5001));

    const row = (listResponse.body?.data ?? []).find(
      (item: { id?: number }) => item.id === 12,
    ) as { assegnataAUserId?: string } | undefined;

    expect(listResponse.status).toBe(200);
    expect(row?.assegnataAUserId).toBe("5001");
  });
});

describe("AC-4 - FORBIDDEN per TECNICO", () => {
  it("Tests AC-4: Given authenticated user role is TECNICO When the user calls GET /api/richieste Then the API responds with HTTP 403 and error.code=FORBIDDEN", async () => {
    await seedPublicRichieste(30);

    const response = await request(app)
      .get("/api/richieste")
      .set("Authorization", authHeader("TECNICO", 4001));

    expect(response.status).toBe(403);
    expect(response.body?.error?.code).toBe("FORBIDDEN");
  });

  it("Tests AC-4: Given authenticated user role is TECNICO When the user calls GET /api/richieste Then forbidden response does not expose data or pagination fields", async () => {
    await seedPublicRichieste(30);

    const response = await request(app)
      .get("/api/richieste")
      .set("Authorization", authHeader("TECNICO", 4001));

    expect(response.status).toBe(403);
    expect(response.body?.data).toBeUndefined();
    expect(response.body?.pagination).toBeUndefined();
  });
});
