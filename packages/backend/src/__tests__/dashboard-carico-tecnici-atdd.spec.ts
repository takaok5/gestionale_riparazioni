import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import {
  assegnaRiparazioneTecnico,
  cambiaStatoRiparazione,
  createRiparazione,
  resetRiparazioniStoreForTests,
} from "../services/riparazioni-service.js";
import { createUser, resetUsersStoreForTests } from "../services/users-service.js";

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

const ADMIN_USER_ID = 7001;
const BASE_REPAIR_INPUT = {
  actorUserId: ADMIN_USER_ID,
  clienteId: 5,
  tipoDispositivo: "Notebook",
  marcaDispositivo: "Dell",
  modelloDispositivo: "Latitude",
  descrizioneProblema: "No power",
  accessoriConsegnati: "alimentatore",
  priorita: "NORMALE",
};

let tecnicoMarioId = 0;
let tecnicoAnnaId = 0;
let commercialeId = 0;

async function seedCaricoTecniciScenario(): Promise<void> {
  const mario = await createUser({
    username: "mario.rossi.6-3",
    email: "mario.rossi.6-3@example.com",
    password: "Password1",
    role: "TECNICO",
  });
  expect(mario.ok).toBe(true);

  const anna = await createUser({
    username: "anna.verdi.6-3",
    email: "anna.verdi.6-3@example.com",
    password: "Password1",
    role: "TECNICO",
  });
  expect(anna.ok).toBe(true);

  const commerciale = await createUser({
    username: "commerciale.6-3",
    email: "commerciale.6-3@example.com",
    password: "Password1",
    role: "COMMERCIALE",
  });
  expect(commerciale.ok).toBe(true);

  tecnicoMarioId = mario.ok ? mario.data.id : 0;
  tecnicoAnnaId = anna.ok ? anna.data.id : 0;
  commercialeId = commerciale.ok ? commerciale.data.id : 0;

  for (let i = 0; i < 9; i += 1) {
    const created = await createRiparazione({
      ...BASE_REPAIR_INPUT,
      serialeDispositivo: `SN-CARICO-${i + 1}`,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      continue;
    }

    const targetTecnicoId = i < 6 ? tecnicoMarioId : tecnicoAnnaId;
    const assigned = await assegnaRiparazioneTecnico({
      riparazioneId: created.data.id,
      tecnicoId: targetTecnicoId,
    });
    expect(assigned.ok).toBe(true);

    const diagnostica = await cambiaStatoRiparazione({
      riparazioneId: created.data.id,
      actorUserId: targetTecnicoId,
      actorRole: "TECNICO",
      stato: "IN_DIAGNOSI",
      note: "Diagnosi avviata",
    });
    expect(diagnostica.ok).toBe(true);

    if (i < 3) {
      const lavorazione = await cambiaStatoRiparazione({
        riparazioneId: created.data.id,
        actorUserId: targetTecnicoId,
        actorRole: "TECNICO",
        stato: "IN_LAVORAZIONE",
        note: "Riparazione avviata",
      });
      expect(lavorazione.ok).toBe(true);
    }
  }
}

beforeEach(async () => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  await seedCaricoTecniciScenario();
});

describe("AC-1 - Carico tecnici con conteggi attivi", () => {
  it("Tests AC-1: Given two tecnici with active repairs 6 and 3 When GET /api/dashboard/carico-tecnici as ADMIN Then returns 200 with expected entries", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("ADMIN", ADMIN_USER_ID));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual(
      expect.arrayContaining([
        {
          tecnicoId: tecnicoMarioId,
          username: "mario.rossi.6-3",
          nome: "Mario Rossi 6 3",
          riparazioniAttive: 6,
        },
        {
          tecnicoId: tecnicoAnnaId,
          username: "anna.verdi.6-3",
          nome: "Anna Verdi 6 3",
          riparazioniAttive: 3,
        },
      ]),
    );
  });

  it("Tests AC-1: Given ADMIN auth When reading /api/dashboard/carico-tecnici Then each row has integer riparazioniAttive >= 0", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("ADMIN", 7002));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    for (const row of response.body as Array<Record<string, unknown>>) {
      expect(Number.isInteger(row.riparazioniAttive)).toBe(true);
      expect(Number(row.riparazioniAttive)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("AC-2 - Include only role TECNICO", () => {
  it("Tests AC-2: Given mixed roles in dataset When GET /api/dashboard/carico-tecnici as ADMIN Then only technician ids are returned", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("ADMIN", 7010));

    expect(response.status).toBe(200);
    const tecnicoIds = (response.body as Array<{ tecnicoId: number }>).map(
      (row) => row.tecnicoId,
    );
    expect(tecnicoIds).toContain(tecnicoMarioId);
    expect(tecnicoIds).toContain(tecnicoAnnaId);
    expect(tecnicoIds).not.toContain(commercialeId);
  });

  it("Tests AC-2: Given ADMIN auth When response arrives Then non-tecnico usernames are not returned", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("ADMIN", 7011));

    expect(response.status).toBe(200);
    const usernames = (response.body as Array<{ username: string }>).map(
      (row) => row.username,
    );
    expect(usernames).not.toContain("commerciale.6-3");
    expect(usernames).toContain("mario.rossi.6-3");
    expect(usernames).toContain("anna.verdi.6-3");
  });
});

describe("AC-3 - Admin only endpoint", () => {
  it("Tests AC-3: Given TECNICO auth When GET /api/dashboard/carico-tecnici Then returns 403 FORBIDDEN with Admin only message", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("TECNICO", tecnicoMarioId));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: "FORBIDDEN", message: "Admin only" },
    });
  });

  it("Tests AC-3: Given TECNICO auth When GET /api/dashboard/carico-tecnici Then response has no workload payload", async () => {
    const response = await request(app)
      .get("/api/dashboard/carico-tecnici")
      .set("Authorization", authHeader("TECNICO", tecnicoAnnaId));

    expect(response.status).toBe(403);
    expect(response.body).not.toHaveProperty("caricoTecnici");
    expect(Array.isArray(response.body)).toBe(false);
  });
});
