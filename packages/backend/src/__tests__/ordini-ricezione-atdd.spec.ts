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

async function createArticoloSeed(index: number, userId: number) {
  const codiceArticolo = `ORD-RIC-${String(index).padStart(4, "0")}`;
  const response = await request(app)
    .post("/api/articoli")
    .set("Authorization", authHeader("ADMIN", userId))
    .send({
      codiceArticolo,
      nome: `Articolo ricezione ordine ${index}`,
      descrizione: `Seed articolo ricezione ${index}`,
      categoria: "RICAMBI",
      fornitoreId: 3,
      prezzoAcquisto: 50,
      prezzoVendita: 80,
      sogliaMinima: 1,
    });

  expect(response.status).toBe(201);
  return {
    id: response.body.id as number,
    codiceArticolo,
  };
}

async function preloadGiacenza(
  articoloId: number,
  quantita: number,
  tecnicoUserId: number,
  riferimento: string,
) {
  const response = await request(app)
    .post(`/api/articoli/${articoloId}/movimenti`)
    .set("Authorization", authHeader("TECNICO", tecnicoUserId))
    .send({ tipo: "CARICO", quantita, riferimento });

  expect(response.status).toBe(201);
}

async function getGiacenzaByCodice(codiceArticolo: string, tecnicoUserId: number) {
  const response = await request(app)
    .get(`/api/articoli?search=${encodeURIComponent(codiceArticolo)}`)
    .set("Authorization", authHeader("TECNICO", tecnicoUserId));

  expect(response.status).toBe(200);
  const articolo = (response.body.data as Array<{ codiceArticolo: string; giacenza: number }>).find(
    (row) => row.codiceArticolo === codiceArticolo,
  );
  expect(articolo).toBeDefined();
  return articolo?.giacenza as number;
}

async function createOrdineSpedito(adminUserId: number) {
  const articoloUno = await createArticoloSeed(adminUserId, adminUserId);
  const articoloDue = await createArticoloSeed(adminUserId + 100, adminUserId + 100);

  await preloadGiacenza(articoloUno.id, 3, adminUserId + 1, "Ordine FOR-PRELOAD-UNO");
  await preloadGiacenza(articoloDue.id, 8, adminUserId + 2, "Ordine FOR-PRELOAD-DUE");

  const created = await request(app)
    .post("/api/ordini")
    .set("Authorization", authHeader("ADMIN", adminUserId + 3))
    .send({
      fornitoreId: 3,
      voci: [
        { articoloId: articoloUno.id, quantitaOrdinata: 10, prezzoUnitario: 100.0 },
        { articoloId: articoloDue.id, quantitaOrdinata: 5, prezzoUnitario: 80.0 },
      ],
    });

  expect(created.status).toBe(201);
  const ordineId = created.body.id as number;

  const emesso = await request(app)
    .patch(`/api/ordini/${ordineId}/stato`)
    .set("Authorization", authHeader("ADMIN", adminUserId + 4))
    .send({ stato: "EMESSO" });
  expect(emesso.status).toBe(200);

  const confermato = await request(app)
    .patch(`/api/ordini/${ordineId}/stato`)
    .set("Authorization", authHeader("ADMIN", adminUserId + 5))
    .send({ stato: "CONFERMATO" });
  expect(confermato.status).toBe(200);

  const spedito = await request(app)
    .patch(`/api/ordini/${ordineId}/stato`)
    .set("Authorization", authHeader("ADMIN", adminUserId + 6))
    .send({ stato: "SPEDITO" });
  expect(spedito.status).toBe(200);

  return {
    ordineId,
    articoloUno,
    articoloDue,
  };
}

beforeEach(() => {
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - Given ordine SPEDITO con due voci e giacenze 3/8 When POST /api/ordini/:id/ricevi completo Then giacenze 13/13 e stato RICEVUTO", () => {
  it("Tests AC-1: Given ordine id=12 stato SPEDITO con voci articolo 5/7 e giacenze 3/8 When POST /api/ordini/12/ricevi con quantita 10 e 5 Then HTTP 200 e stato RICEVUTO", async () => {
    const setup = await createOrdineSpedito(9001);

    const response = await request(app)
      .post(`/api/ordini/${setup.ordineId}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9008))
      .send({
        voci: [
          { articoloId: setup.articoloUno.id, quantitaRicevuta: 10 },
          { articoloId: setup.articoloDue.id, quantitaRicevuta: 5 },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("RICEVUTO");
  });

  it("Tests AC-1: Given ricezione completa riuscita When verifico articoli Then giacenze sono 13 e 13", async () => {
    const setup = await createOrdineSpedito(9011);

    await request(app)
      .post(`/api/ordini/${setup.ordineId}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9018))
      .send({
        voci: [
          { articoloId: setup.articoloUno.id, quantitaRicevuta: 10 },
          { articoloId: setup.articoloDue.id, quantitaRicevuta: 5 },
        ],
      });

    const giacenzaUno = await getGiacenzaByCodice(setup.articoloUno.codiceArticolo, 9019);
    const giacenzaDue = await getGiacenzaByCodice(setup.articoloDue.codiceArticolo, 9020);
    expect(giacenzaUno).toBe(13);
    expect(giacenzaDue).toBe(13);
  });
});

describe("AC-2 - Given ordine con 2 voci When POST /api/ordini/:id/ricevi parziale solo articolo 5 Then solo articolo 5 incrementa e ordine resta SPEDITO", () => {
  it("Tests AC-2: Given ordine SPEDITO When ricevo solo articoloUno quantita 6 Then HTTP 200 e stato SPEDITO", async () => {
    const setup = await createOrdineSpedito(9101);

    const response = await request(app)
      .post(`/api/ordini/${setup.ordineId}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9108))
      .send({
        voci: [{ articoloId: setup.articoloUno.id, quantitaRicevuta: 6 }],
      });

    expect(response.status).toBe(200);
    expect(response.body?.data?.stato).toBe("SPEDITO");
  });

  it("Tests AC-2: Given ricezione parziale articoloUno When verifico giacenze Then articoloUno=9 e articoloDue=8", async () => {
    const setup = await createOrdineSpedito(9111);

    await request(app)
      .post(`/api/ordini/${setup.ordineId}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9118))
      .send({
        voci: [{ articoloId: setup.articoloUno.id, quantitaRicevuta: 6 }],
      });

    const giacenzaUno = await getGiacenzaByCodice(setup.articoloUno.codiceArticolo, 9119);
    const giacenzaDue = await getGiacenzaByCodice(setup.articoloDue.codiceArticolo, 9120);
    expect(giacenzaUno).toBe(9);
    expect(giacenzaDue).toBe(8);
  });
});

describe("AC-3 - Given ordine con prima voce gia ricevuta When POST /api/ordini/:id/ricevi seconda voce Then ordine diventa RICEVUTO", () => {
  it("Tests AC-3: Given prima ricezione parziale su articoloUno e ordine SPEDITO When ricevo articoloDue quantita 5 Then HTTP 200 e stato RICEVUTO", async () => {
    const setup = await createOrdineSpedito(9201);

    const firstReceipt = await request(app)
      .post(`/api/ordini/${setup.ordineId}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9208))
      .send({
        voci: [{ articoloId: setup.articoloUno.id, quantitaRicevuta: 10 }],
      });
    expect(firstReceipt.status).toBe(200);
    expect(firstReceipt.body?.data?.stato).toBe("SPEDITO");

    const secondReceipt = await request(app)
      .post(`/api/ordini/${setup.ordineId}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9209))
      .send({
        voci: [{ articoloId: setup.articoloDue.id, quantitaRicevuta: 5 }],
      });

    expect(secondReceipt.status).toBe(200);
    expect(secondReceipt.body?.data?.stato).toBe("RICEVUTO");
  });

  it("Tests AC-3: Given seconda ricezione completa When verifico giacenza articoloDue Then valore finale e 13", async () => {
    const setup = await createOrdineSpedito(9211);

    await request(app)
      .post(`/api/ordini/${setup.ordineId}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9218))
      .send({
        voci: [{ articoloId: setup.articoloUno.id, quantitaRicevuta: 10 }],
      });

    await request(app)
      .post(`/api/ordini/${setup.ordineId}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9219))
      .send({
        voci: [{ articoloId: setup.articoloDue.id, quantitaRicevuta: 5 }],
      });

    const giacenzaDue = await getGiacenzaByCodice(setup.articoloDue.codiceArticolo, 9220);
    expect(giacenzaDue).toBe(13);
  });
});

describe("AC-4 - Given ordine in BOZZA When POST /api/ordini/:id/ricevi Then 400 VALIDATION_ERROR Cannot receive order in BOZZA state", () => {
  it('Tests AC-4: Given ordine BOZZA When POST /api/ordini/:id/ricevi Then 400 with message \"Cannot receive order in BOZZA state\"', async () => {
    const articoloUno = await createArticoloSeed(9301, 9301);
    const articoloDue = await createArticoloSeed(9302, 9302);
    const created = await request(app)
      .post("/api/ordini")
      .set("Authorization", authHeader("ADMIN", 9303))
      .send({
        fornitoreId: 3,
        voci: [
          { articoloId: articoloUno.id, quantitaOrdinata: 10, prezzoUnitario: 100.0 },
          { articoloId: articoloDue.id, quantitaOrdinata: 5, prezzoUnitario: 80.0 },
        ],
      });
    expect(created.status).toBe(201);

    const response = await request(app)
      .post(`/api/ordini/${created.body.id as number}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9304))
      .send({
        voci: [{ articoloId: articoloUno.id, quantitaRicevuta: 10 }],
      });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
    expect(response.body?.error?.message).toBe("Cannot receive order in BOZZA state");
  });

  it("Tests AC-4: Given ricezione BOZZA rifiutata When verifico giacenza articoloUno Then resta invariata a 0", async () => {
    const articoloUno = await createArticoloSeed(9311, 9311);
    const articoloDue = await createArticoloSeed(9312, 9312);
    const created = await request(app)
      .post("/api/ordini")
      .set("Authorization", authHeader("ADMIN", 9313))
      .send({
        fornitoreId: 3,
        voci: [
          { articoloId: articoloUno.id, quantitaOrdinata: 10, prezzoUnitario: 100.0 },
          { articoloId: articoloDue.id, quantitaOrdinata: 5, prezzoUnitario: 80.0 },
        ],
      });
    expect(created.status).toBe(201);

    const response = await request(app)
      .post(`/api/ordini/${created.body.id as number}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9314))
      .send({
        voci: [{ articoloId: articoloUno.id, quantitaRicevuta: 10 }],
      });
    expect(response.status).toBe(400);

    const giacenzaUno = await getGiacenzaByCodice(articoloUno.codiceArticolo, 9315);
    expect(giacenzaUno).toBe(0);
  });
});

describe("Hardening - Validazioni payload ricezione", () => {
  it("Given payload con articolo duplicato in voci When POST /api/ordini/:id/ricevi Then 400 VALIDATION_ERROR", async () => {
    const setup = await createOrdineSpedito(9401);

    const response = await request(app)
      .post(`/api/ordini/${setup.ordineId}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9408))
      .send({
        voci: [
          { articoloId: setup.articoloUno.id, quantitaRicevuta: 4 },
          { articoloId: setup.articoloUno.id, quantitaRicevuta: 1 },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("Given quantitaRicevuta superiore al residuo When POST /api/ordini/:id/ricevi Then 400 con dettaglio quantità eccedente", async () => {
    const setup = await createOrdineSpedito(9411);

    const response = await request(app)
      .post(`/api/ordini/${setup.ordineId}/ricevi`)
      .set("Authorization", authHeader("ADMIN", 9418))
      .send({
        voci: [{ articoloId: setup.articoloUno.id, quantitaRicevuta: 11 }],
      });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
    expect(response.body?.error?.message).toContain("remaining");
  });
});
