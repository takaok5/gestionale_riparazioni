import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetRateLimiter } from "../services/login-rate-limit.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

type LeadPayload = {
  tipo: "PREVENTIVO" | "APPUNTAMENTO";
  nome: string;
  email: string;
  problema: string;
  consensoPrivacy: true;
};

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

function buildLeadPayload(index: number, overrides: Partial<LeadPayload> = {}): LeadPayload {
  return {
    tipo: "PREVENTIVO",
    nome: `Lead ${index}`,
    email: `lead-${index}@test.it`,
    problema: `Display rotto ${index}`,
    consensoPrivacy: true,
    ...overrides,
  };
}

async function seedRichiestaAtId(
  targetId: number,
  overrides: Partial<LeadPayload> = {},
): Promise<void> {
  for (let i = 1; i <= targetId; i += 1) {
    const payload = i === targetId ? buildLeadPayload(i, overrides) : buildLeadPayload(i);
    const response = await request(app).post("/api/public/richieste").send(payload);
    expect(response.status).toBe(201);
  }
}

async function createExistingCliente(email: string, actorUserId: number): Promise<number> {
  const response = await request(app)
    .post("/api/clienti")
    .set("Authorization", authHeader("COMMERCIALE", actorUserId))
    .send({
      nome: "Cliente Esistente",
      tipologia: "PRIVATO",
      codiceFiscale: "RSSMRA80A01H501U",
      telefono: "3331234567",
      email,
      indirizzo: "Via Roma 1",
      cap: "00100",
      citta: "Roma",
      provincia: "RM",
    });

  expect(response.status).toBe(201);
  expect(typeof response.body?.id).toBe("number");
  return response.body.id as number;
}

async function getClientiTotal(actorUserId: number): Promise<number> {
  const response = await request(app)
    .get("/api/clienti?page=1&limit=1")
    .set("Authorization", authHeader("COMMERCIALE", actorUserId));

  expect(response.status).toBe(200);
  return Number(response.body?.meta?.total ?? 0);
}

async function getRiparazioniTotal(actorUserId: number): Promise<number> {
  const response = await request(app)
    .get("/api/riparazioni?page=1&limit=1")
    .set("Authorization", authHeader("TECNICO", actorUserId));

  expect(response.status).toBe(200);
  return Number(response.body?.meta?.total ?? 0);
}

beforeEach(() => {
  process.env.NODE_ENV = "test";
  resetRateLimiter();
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - conversione crea cliente e aggiorna stato richiesta", () => {
  it('Tests AC-1: Given richiesta id=12 exists in backoffice lead list with fields nome,email,problema,tipo and stato="NUOVA" When authenticated COMMERCIALE calls POST /api/richieste/12/converti Then API returns 200 with data.richiesta.id=12 and data.richiesta.stato="CONVERTITA"', async () => {
    await seedRichiestaAtId(12, {
      nome: "Mario Rossi",
      email: "mario.rossi@test.it",
      problema: "Display rotto",
    });

    const response = await request(app)
      .post("/api/richieste/12/converti")
      .set("Authorization", authHeader("COMMERCIALE", 5001))
      .send({ mode: "RIPARAZIONE" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.richiesta?.id).toBe(12);
    expect(response.body?.data?.richiesta?.stato).toBe("CONVERTITA");
  });

  it('Tests AC-1: Given conversion updates richiesta from NUOVA to CONVERTITA When ADMIN calls POST /api/richieste/12/converti Then audit log model RichiestaPubblica contains objectId=12 with dettagli.old.stato=NUOVA and dettagli.new.stato=CONVERTITA', async () => {
    await seedRichiestaAtId(12);

    const convertResponse = await request(app)
      .post("/api/richieste/12/converti")
      .set("Authorization", authHeader("ADMIN", 1000))
      .send({ mode: "RIPARAZIONE" });
    expect(convertResponse.status).toBe(200);

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
    expect(row?.dettagli?.new?.stato).toBe("CONVERTITA");
  });
});

describe("AC-2 - conversione riusa cliente esistente senza duplicati", () => {
  it("Tests AC-2: Given richiesta id=12 contains email already associated to an existing cliente When POST /api/richieste/12/converti is executed Then conversion reuses existing cliente.id in response data.cliente.id", async () => {
    const existingClienteId = await createExistingCliente("reuse-12@test.it", 5101);
    await seedRichiestaAtId(12, { email: "reuse-12@test.it" });

    const response = await request(app)
      .post("/api/richieste/12/converti")
      .set("Authorization", authHeader("COMMERCIALE", 5101))
      .send({ mode: "RIPARAZIONE" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.cliente?.id).toBe(existingClienteId);
  });

  it("Tests AC-2: Given existing customer matches lead email When conversion runs Then total clienti count does not increase", async () => {
    await createExistingCliente("reuse-count@test.it", 5102);
    await seedRichiestaAtId(12, { email: "reuse-count@test.it" });

    const beforeTotal = await getClientiTotal(5102);
    const response = await request(app)
      .post("/api/richieste/12/converti")
      .set("Authorization", authHeader("COMMERCIALE", 5102))
      .send({ mode: "RIPARAZIONE" });
    const afterTotal = await getClientiTotal(5102);

    expect(response.status).toBe(200);
    expect(afterTotal).toBe(beforeTotal);
  });
});

describe("AC-3 - conversione crea bozza riparazione precompilata", () => {
  it('Tests AC-3: Given conversion target is repair flow and richiesta id=12 has problema="Display rotto" When POST /api/richieste/12/converti succeeds in mode RIPARAZIONE Then response includes riparazione draft with descrizioneProblema="Display rotto" and priorita="NORMALE"', async () => {
    await seedRichiestaAtId(12, { problema: "Display rotto" });

    const response = await request(app)
      .post("/api/richieste/12/converti")
      .set("Authorization", authHeader("COMMERCIALE", 5201))
      .send({ mode: "RIPARAZIONE" });

    expect(response.status).toBe(200);
    expect(response.body?.data?.riparazione?.descrizioneProblema).toBe("Display rotto");
    expect(response.body?.data?.riparazione?.priorita).toBe("NORMALE");
  });

  it("Tests AC-3: Given lead does not provide device fields When conversion creates riparazione Then required fallback fields tipoDispositivo/marcaDispositivo/modelloDispositivo/serialeDispositivo/accessoriConsegnati are non-empty strings", async () => {
    await seedRichiestaAtId(12, { problema: "Microfono non funziona" });

    const response = await request(app)
      .post("/api/richieste/12/converti")
      .set("Authorization", authHeader("COMMERCIALE", 5202))
      .send({ mode: "RIPARAZIONE" });

    const draft = response.body?.data?.riparazione;

    expect(response.status).toBe(200);
    expect((draft?.tipoDispositivo ?? "").trim().length).toBeGreaterThan(0);
    expect((draft?.marcaDispositivo ?? "").trim().length).toBeGreaterThan(0);
    expect((draft?.modelloDispositivo ?? "").trim().length).toBeGreaterThan(0);
    expect((draft?.serialeDispositivo ?? "").trim().length).toBeGreaterThan(0);
    expect((draft?.accessoriConsegnati ?? "").trim().length).toBeGreaterThan(0);
  });
});

describe("AC-4 - riconversione lead gia convertita ritorna 409", () => {
  it('Tests AC-4: Given richiesta id=12 has stato CONVERTITA When POST /api/richieste/12/converti is called again Then API returns HTTP 409 with error.code REQUEST_ALREADY_CONVERTED', async () => {
    await seedRichiestaAtId(12);

    const firstConversion = await request(app)
      .post("/api/richieste/12/converti")
      .set("Authorization", authHeader("COMMERCIALE", 5301))
      .send({ mode: "RIPARAZIONE" });
    expect(firstConversion.status).toBe(200);

    const secondConversion = await request(app)
      .post("/api/richieste/12/converti")
      .set("Authorization", authHeader("COMMERCIALE", 5301))
      .send({ mode: "RIPARAZIONE" });

    expect(secondConversion.status).toBe(409);
    expect(secondConversion.body?.error?.code).toBe("REQUEST_ALREADY_CONVERTED");
  });

  it("Tests AC-4: Given richiesta already converted When conversion is retried Then no new cliente and no new riparazione are created", async () => {
    await seedRichiestaAtId(12);

    const clientiBefore = await getClientiTotal(5302);
    const riparazioniBefore = await getRiparazioniTotal(5302);

    const firstConversion = await request(app)
      .post("/api/richieste/12/converti")
      .set("Authorization", authHeader("COMMERCIALE", 5302))
      .send({ mode: "RIPARAZIONE" });
    expect(firstConversion.status).toBe(200);

    const clientiAfterFirst = await getClientiTotal(5302);
    const riparazioniAfterFirst = await getRiparazioniTotal(5302);

    const secondConversion = await request(app)
      .post("/api/richieste/12/converti")
      .set("Authorization", authHeader("COMMERCIALE", 5302))
      .send({ mode: "RIPARAZIONE" });
    expect(secondConversion.status).toBe(409);

    const clientiAfterSecond = await getClientiTotal(5302);
    const riparazioniAfterSecond = await getRiparazioniTotal(5302);

    expect(clientiAfterFirst).toBeGreaterThanOrEqual(clientiBefore);
    expect(riparazioniAfterFirst).toBeGreaterThanOrEqual(riparazioniBefore);
    expect(clientiAfterSecond).toBe(clientiAfterFirst);
    expect(riparazioniAfterSecond).toBe(riparazioniAfterFirst);
  });
});
