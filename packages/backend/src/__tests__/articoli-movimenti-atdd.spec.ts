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
    codiceArticolo: `MOV-${String(index).padStart(4, "0")}`,
    nome: `Ricambio Movimento ${index}`,
    descrizione: `Articolo test movimenti ${index}`,
    categoria: "DISPLAY",
    fornitoreId: 3,
    prezzoAcquisto: 50 + index,
    prezzoVendita: 90 + index,
    sogliaMinima: 5,
    ...overrides,
  };
}

async function createArticolo(index: number, adminUserId: number) {
  const payload = buildArticoloPayload(index);
  const response = await request(app)
    .post("/api/articoli")
    .set("Authorization", authHeader("ADMIN", adminUserId))
    .send(payload);

  expect(response.status).toBe(201);
  return {
    id: response.body.id as number,
    codiceArticolo: payload.codiceArticolo,
  };
}

async function getGiacenzaByCodice(codiceArticolo: string, tecnicoUserId: number) {
  const response = await request(app)
    .get(`/api/articoli?search=${encodeURIComponent(codiceArticolo)}`)
    .set("Authorization", authHeader("TECNICO", tecnicoUserId));

  expect(response.status).toBe(200);
  expect(Array.isArray(response.body.data)).toBe(true);
  expect(response.body.data.length).toBeGreaterThan(0);
  const articolo = response.body.data.find(
    (row: { codiceArticolo: string }) => row.codiceArticolo === codiceArticolo,
  );
  expect(articolo).toBeDefined();
  return articolo.giacenza as number;
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Movimento CARICO con tracciamento utente e timestamp", () => {
  it('Tests AC-1: Given articolo giacenza 10 When POST CARICO 20 Then 201 and giacenza 30', async () => {
    const articolo = await createArticolo(1, 5100);

    const preload = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5101))
      .send({ tipo: "CARICO", quantita: 10, riferimento: "Ordine FOR-000001-PRELOAD" });
    expect(preload.status).toBe(201);

    const response = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5101))
      .send({ tipo: "CARICO", quantita: 20, riferimento: "Ordine FOR-000001" });

    expect(response.status).toBe(201);
    const giacenza = await getGiacenzaByCodice(articolo.codiceArticolo, 5102);
    expect(giacenza).toBe(30);
  });

  it("Tests AC-1: Given CARICO succeeded When reading response Then movimento has userId and timestamp", async () => {
    const articolo = await createArticolo(2, 5110);
    const tecnicoUserId = 5111;

    const response = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", tecnicoUserId))
      .send({ tipo: "CARICO", quantita: 20, riferimento: "Ordine FOR-000001" });

    expect(response.status).toBe(201);
    expect(response.body.movimento.userId).toBe(tecnicoUserId);
    expect(response.body.movimento.timestamp).toEqual(expect.any(String));
  });
});

describe("AC-2 - Movimento SCARICO con decremento giacenza", () => {
  it("Tests AC-2: Given giacenza 30 When POST SCARICO 15 Then 201 and giacenza 15", async () => {
    const articolo = await createArticolo(3, 5200);

    const preload = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5201))
      .send({ tipo: "CARICO", quantita: 30, riferimento: "Ordine FOR-000002" });
    expect(preload.status).toBe(201);

    const response = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5201))
      .send({
        tipo: "SCARICO",
        quantita: 15,
        riferimento: "Riparazione RIP-20260209-0001",
      });

    expect(response.status).toBe(201);
    const giacenza = await getGiacenzaByCodice(articolo.codiceArticolo, 5202);
    expect(giacenza).toBe(15);
  });

  it("Tests AC-2: Given SCARICO accepted When reading movimento Then tipo and riferimento are persisted", async () => {
    const articolo = await createArticolo(4, 5210);
    const preload = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5211))
      .send({ tipo: "CARICO", quantita: 30, riferimento: "Ordine FOR-000003" });
    expect(preload.status).toBe(201);

    const response = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5211))
      .send({
        tipo: "SCARICO",
        quantita: 15,
        riferimento: "Riparazione RIP-20260209-0001",
      });

    expect(response.status).toBe(201);
    expect(response.body.movimento.tipo).toBe("SCARICO");
    expect(response.body.movimento.riferimento).toBe("Riparazione RIP-20260209-0001");
  });
});

describe("AC-3 - Blocco scarico oltre disponibilita", () => {
  it('Tests AC-3: Given giacenza 5 When POST SCARICO 10 Then 400 "Insufficient stock..."', async () => {
    const articolo = await createArticolo(5, 5300);
    const preload = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5301))
      .send({ tipo: "CARICO", quantita: 5, riferimento: "Ordine FOR-000004" });
    expect(preload.status).toBe(201);

    const response = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5301))
      .send({ tipo: "SCARICO", quantita: 10 });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(
      "Insufficient stock: available 5, requested 10",
    );
  });

  it("Tests AC-3: Given rejected SCARICO When checking stock Then giacenza remains unchanged", async () => {
    const articolo = await createArticolo(6, 5310);
    const preload = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5311))
      .send({ tipo: "CARICO", quantita: 5, riferimento: "Ordine FOR-000005" });
    expect(preload.status).toBe(201);

    await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5311))
      .send({ tipo: "SCARICO", quantita: 10 });

    const giacenza = await getGiacenzaByCodice(articolo.codiceArticolo, 5312);
    expect(giacenza).toBe(5);
  });
});

describe("AC-4 - Movimento RETTIFICA con quantita negativa", () => {
  it("Tests AC-4: Given giacenza 15 When POST RETTIFICA -5 Then 201 and giacenza 10", async () => {
    const articolo = await createArticolo(7, 5400);
    const preload = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5401))
      .send({ tipo: "CARICO", quantita: 15, riferimento: "Ordine FOR-000006" });
    expect(preload.status).toBe(201);

    const response = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5401))
      .send({ tipo: "RETTIFICA", quantita: -5, riferimento: "Inventario fisico" });

    expect(response.status).toBe(201);
    const giacenza = await getGiacenzaByCodice(articolo.codiceArticolo, 5402);
    expect(giacenza).toBe(10);
  });

  it("Tests AC-4: Given RETTIFICA applied When reading movimento Then tipo RETTIFICA and riferimento are returned", async () => {
    const articolo = await createArticolo(8, 5410);
    const preload = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5411))
      .send({ tipo: "CARICO", quantita: 15, riferimento: "Ordine FOR-000007" });
    expect(preload.status).toBe(201);

    const response = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5411))
      .send({ tipo: "RETTIFICA", quantita: -5, riferimento: "Inventario fisico" });

    expect(response.status).toBe(201);
    expect(response.body.movimento.tipo).toBe("RETTIFICA");
    expect(response.body.movimento.riferimento).toBe("Inventario fisico");
  });
});

describe("AC-5 - Gestione concorrente SCARICO in transazione atomica", () => {
  it("Tests AC-5: Given giacenza 10 When two SCARICO 7 run in parallel Then only one request returns 201", async () => {
    const articolo = await createArticolo(9, 5500);
    const preload = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5501))
      .send({ tipo: "CARICO", quantita: 10, riferimento: "Ordine FOR-000008" });
    expect(preload.status).toBe(201);

    const payload = {
      tipo: "SCARICO",
      quantita: 7,
      riferimento: "Riparazione RIP-20260209-0002",
    };
    const [resA, resB] = await Promise.all([
      request(app)
        .post(`/api/articoli/${articolo.id}/movimenti`)
        .set("Authorization", authHeader("TECNICO", 5502))
        .send(payload),
      request(app)
        .post(`/api/articoli/${articolo.id}/movimenti`)
        .set("Authorization", authHeader("TECNICO", 5503))
        .send(payload),
    ]);

    const statuses = [resA.status, resB.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 400]);
  });

  it('Tests AC-5: Given one parallel SCARICO fails When checking side effects Then final giacenza is 3 and failure message is "Insufficient stock"', async () => {
    const articolo = await createArticolo(10, 5510);
    const preload = await request(app)
      .post(`/api/articoli/${articolo.id}/movimenti`)
      .set("Authorization", authHeader("TECNICO", 5511))
      .send({ tipo: "CARICO", quantita: 10, riferimento: "Ordine FOR-000009" });
    expect(preload.status).toBe(201);

    const payload = {
      tipo: "SCARICO",
      quantita: 7,
      riferimento: "Riparazione RIP-20260209-0002",
    };
    const [resA, resB] = await Promise.all([
      request(app)
        .post(`/api/articoli/${articolo.id}/movimenti`)
        .set("Authorization", authHeader("TECNICO", 5512))
        .send(payload),
      request(app)
        .post(`/api/articoli/${articolo.id}/movimenti`)
        .set("Authorization", authHeader("TECNICO", 5513))
        .send(payload),
    ]);

    const failed = [resA, resB].find((res) => res.status === 400);
    expect(failed).toBeDefined();
    expect(failed?.body.error.message).toContain("Insufficient stock");
    const giacenza = await getGiacenzaByCodice(articolo.codiceArticolo, 5514);
    expect(giacenza).toBe(3);
  });
});
