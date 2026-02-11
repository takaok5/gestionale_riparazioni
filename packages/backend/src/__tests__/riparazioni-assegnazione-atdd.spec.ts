import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import { resetRiparazioniStoreForTests } from "../services/riparazioni-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign(
    { ...payload, tokenType: "access" as const },
    "test-jwt-secret",
    { expiresIn: "15m" },
  );
}

function authHeader(role: Role, userId = 10000): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

function buildRiparazionePayload(index: number): Record<string, unknown> {
  return {
    clienteId: 5,
    tipoDispositivo: "Smartphone",
    marcaDispositivo: "Samsung",
    modelloDispositivo: `Model-${index}`,
    serialeDispositivo: `SN-ASSEGNA-${index}`,
    descrizioneProblema: `Problema ${index}`,
    accessoriConsegnati: "Caricabatterie",
    priorita: "NORMALE",
  };
}

async function seedUsersUpToId8(): Promise<void> {
  const users = [
    { role: "ADMIN", username: "u3-admin", email: "u3-admin@example.com" },
    { role: "TECNICO", username: "u4-tecnico", email: "u4-tecnico@example.com" },
    {
      role: "COMMERCIALE",
      username: "u5-commerciale",
      email: "u5-commerciale@example.com",
    },
    { role: "ADMIN", username: "u6-admin", email: "u6-admin@example.com" },
    { role: "TECNICO", username: "u7-tecnico", email: "u7-tecnico@example.com" },
    { role: "TECNICO", username: "u8-tecnico", email: "u8-tecnico@example.com" },
  ] as const;

  for (const [index, user] of users.entries()) {
    const expectedId = index + 3;
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", authHeader("ADMIN", 19999))
      .send({
        username: user.username,
        email: user.email,
        password: "Password1",
        role: user.role,
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(expectedId);
    expect(response.body.role).toBe(user.role);
  }
}

async function seedRiparazioniUntilId10(): Promise<void> {
  for (let index = 1; index <= 10; index += 1) {
    const response = await request(app)
      .post("/api/riparazioni")
      .set("Authorization", authHeader("TECNICO", 7))
      .send(buildRiparazionePayload(index));

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(index);
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-11T10:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - Assegnazione valida a tecnico", () => {
  it("Tests AC-1: Given admin and user id=7 role TECNICO When PATCH /api/riparazioni/10/assegna {tecnicoId:7} Then 200 and data.id=10 data.tecnicoId=7", async () => {
    await seedUsersUpToId8();
    await seedRiparazioniUntilId10();

    const response = await request(app)
      .patch("/api/riparazioni/10/assegna")
      .set("Authorization", authHeader("ADMIN", 30001))
      .send({ tecnicoId: 7 });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(10);
    expect(response.body.data.tecnicoId).toBe(7);
  });

  it("Tests AC-1: Given assignment to tecnico id=7 succeeds When requesting detail Then riparazione 10 has tecnico.id=7", async () => {
    await seedUsersUpToId8();
    await seedRiparazioniUntilId10();

    const assignResponse = await request(app)
      .patch("/api/riparazioni/10/assegna")
      .set("Authorization", authHeader("ADMIN", 30002))
      .send({ tecnicoId: 7 });

    expect(assignResponse.status).toBe(200);
    expect(assignResponse.body.data.tecnicoId).toBe(7);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("ADMIN", 30002));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.id).toBe(10);
    expect(detailResponse.body.data.tecnico.id).toBe(7);
  });
});

describe("AC-2 - Rifiuto assegnazione a utente non tecnico", () => {
  it("Tests AC-2: Given user id=5 role COMMERCIALE When PATCH /api/riparazioni/10/assegna {tecnicoId:5} Then 400 with VALIDATION_ERROR and message", async () => {
    await seedUsersUpToId8();
    await seedRiparazioniUntilId10();

    const response = await request(app)
      .patch("/api/riparazioni/10/assegna")
      .set("Authorization", authHeader("ADMIN", 30003))
      .send({ tecnicoId: 5 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.message).toBe("User must have TECNICO role");
  });

  it("Tests AC-2: Given assignment to COMMERCIALE fails When requesting detail Then tecnico.id remains 7", async () => {
    await seedUsersUpToId8();
    await seedRiparazioniUntilId10();

    const assignResponse = await request(app)
      .patch("/api/riparazioni/10/assegna")
      .set("Authorization", authHeader("ADMIN", 30004))
      .send({ tecnicoId: 5 });

    expect(assignResponse.status).toBe(400);
    expect(assignResponse.body.error.message).toBe("User must have TECNICO role");

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("ADMIN", 30004));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.id).toBe(10);
    expect(detailResponse.body.data.tecnico.id).toBe(7);
  });
});

describe("AC-3 - Riassegnazione a un altro tecnico", () => {
  it("Tests AC-3: Given riparazione id=10 assigned to tecnico id=7 When PATCH /api/riparazioni/10/assegna {tecnicoId:8} Then 200 and data.tecnicoId=8", async () => {
    await seedUsersUpToId8();
    await seedRiparazioniUntilId10();

    const response = await request(app)
      .patch("/api/riparazioni/10/assegna")
      .set("Authorization", authHeader("ADMIN", 30005))
      .send({ tecnicoId: 8 });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(10);
    expect(response.body.data.tecnicoId).toBe(8);
  });

  it("Tests AC-3: Given reassignment to tecnico id=8 succeeds When requesting detail Then tecnico.id is 8", async () => {
    await seedUsersUpToId8();
    await seedRiparazioniUntilId10();

    const assignResponse = await request(app)
      .patch("/api/riparazioni/10/assegna")
      .set("Authorization", authHeader("ADMIN", 30006))
      .send({ tecnicoId: 8 });

    expect(assignResponse.status).toBe(200);
    expect(assignResponse.body.data.tecnicoId).toBe(8);

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("ADMIN", 30006));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.id).toBe(10);
    expect(detailResponse.body.data.tecnico.id).toBe(8);
  });
});

describe("AC-4 - Divieto assegnazione per non Admin", () => {
  it("Tests AC-4: Given user role TECNICO When PATCH /api/riparazioni/10/assegna Then 403 FORBIDDEN", async () => {
    await seedUsersUpToId8();
    await seedRiparazioniUntilId10();

    const response = await request(app)
      .patch("/api/riparazioni/10/assegna")
      .set("Authorization", authHeader("TECNICO", 30007))
      .send({ tecnicoId: 7 });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(response.body.error.message).toBe("Accesso negato");
  });

  it("Tests AC-4: Given non-admin assignment attempt When reading detail after request Then tecnico.id remains unchanged", async () => {
    await seedUsersUpToId8();
    await seedRiparazioniUntilId10();

    const assignResponse = await request(app)
      .patch("/api/riparazioni/10/assegna")
      .set("Authorization", authHeader("TECNICO", 30008))
      .send({ tecnicoId: 8 });

    expect(assignResponse.status).toBe(403);
    expect(assignResponse.body.error.code).toBe("FORBIDDEN");

    const detailResponse = await request(app)
      .get("/api/riparazioni/10")
      .set("Authorization", authHeader("ADMIN", 30008));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.id).toBe(10);
    expect(detailResponse.body.data.tecnico.id).toBe(7);
  });
});

describe("Review hardening - error handling coverage", () => {
  it("Given tecnicoId=999 does not exist When ADMIN patches /api/riparazioni/10/assegna Then returns 404 USER_NOT_FOUND", async () => {
    await seedUsersUpToId8();
    await seedRiparazioniUntilId10();

    const response = await request(app)
      .patch("/api/riparazioni/10/assegna")
      .set("Authorization", authHeader("ADMIN", 30009))
      .send({ tecnicoId: 999 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("USER_NOT_FOUND");
    expect(response.body.error.message).toBe("Utente non trovato");
  });

  it("Given tecnicoId is not a positive integer When ADMIN patches /api/riparazioni/10/assegna Then returns 400 VALIDATION_ERROR on tecnicoId", async () => {
    await seedUsersUpToId8();
    await seedRiparazioniUntilId10();

    const response = await request(app)
      .patch("/api/riparazioni/10/assegna")
      .set("Authorization", authHeader("ADMIN", 30010))
      .send({ tecnicoId: "abc" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.field).toBe("tecnicoId");
  });
});
