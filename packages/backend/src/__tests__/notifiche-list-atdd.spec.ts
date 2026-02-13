import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";
import {
  createPreventivoNotifica,
  createRiparazioneStatoNotifica,
  resetNotificheStoreForTests,
} from "../services/notifiche-service.js";
import { resetPreventiviStoreForTests } from "../services/preventivi-service.js";
import { resetRiparazioniStoreForTests } from "../services/riparazioni-service.js";
import { resetUsersStoreForTests } from "../services/users-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

function buildAccessToken(payload: { userId: number; role: Role }): string {
  return jwt.sign({ ...payload, tokenType: "access" as const }, "test-jwt-secret", {
    expiresIn: "15m",
  });
}

function authHeader(role: Role, userId = 7901): string {
  return `Bearer ${buildAccessToken({ userId, role })}`;
}

async function seedMixedNotifiche(total = 50): Promise<void> {
  for (let index = 0; index < total; index += 1) {
    const day = (index % 28) + 1;
    const iso = `2026-02-${String(day).padStart(2, "0")}T12:00:00.000Z`;
    vi.setSystemTime(new Date(iso));

    if (index % 2 === 0) {
      await createPreventivoNotifica({
        preventivoId: 1000 + index,
        codiceRiparazione: `RIP-20260209-${String(index + 1).padStart(4, "0")}`,
        destinatario: `cliente${index}@test.it`,
        voci: [
          {
            tipo: "MANODOPERA",
            descrizione: "Diagnosi",
            quantita: 1,
            prezzoUnitario: 50,
          },
        ],
        subtotale: 50,
        iva: 11,
        totale: 61,
        allegatoPath: `docs/preventivi/preventivo-${1000 + index}.pdf`,
        stato: index % 4 === 0 ? "FALLITA" : "INVIATA",
      });
    } else {
      await createRiparazioneStatoNotifica({
        riparazioneId: 2000 + index,
        codiceRiparazione: `RIP-20260209-${String(index + 1).padStart(4, "0")}`,
        statoRiparazione: "RICEVUTA",
        destinatario: `cliente${index}@test.it`,
      });
    }
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-02-13T11:00:00.000Z"));
  resetUsersStoreForTests();
  resetAnagraficheStoreForTests();
  resetRiparazioniStoreForTests();
  resetPreventiviStoreForTests();
  resetNotificheStoreForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-1 - GET /api/notifiche?page=1&limit=20 paginated with meta", () => {
  it("Tests AC-1: Given 50 notifiche When page=1 limit=20 Then returns 20 rows with required fields and pagination meta", async () => {
    await seedMixedNotifiche(50);

    const response = await request(app)
      .get("/api/notifiche?page=1&limit=20")
      .set("Authorization", authHeader("ADMIN", 7902));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data)).toBe(true);
    expect(response.body?.data?.length).toBe(20);
    expect(response.body?.meta?.page).toBe(1);
    expect(response.body?.meta?.limit).toBe(20);
    expect(response.body?.meta?.total).toBe(50);
    expect(response.body?.meta?.totalPages).toBe(3);

    const first = response.body?.data?.[0];
    expect(first).toMatchObject({
      id: expect.any(Number),
      tipo: expect.any(String),
      destinatario: expect.any(String),
      oggetto: expect.any(String),
      stato: expect.any(String),
      dataInvio: expect.any(String),
    });
  });

  it("Tests AC-1: Given deterministic ordering requirement When page=1 limit=20 Then rows are sorted by dataInvio desc and id desc", async () => {
    await seedMixedNotifiche(50);

    const response = await request(app)
      .get("/api/notifiche?page=1&limit=20")
      .set("Authorization", authHeader("ADMIN", 7903));

    expect(response.status).toBe(200);
    const rows = response.body?.data ?? [];
    expect(rows.length).toBe(20);
    expect(rows[0]?.id).toBeGreaterThan(rows[rows.length - 1]?.id ?? 0);
  });
});

describe("AC-2 - GET /api/notifiche?tipo=PREVENTIVO returns only PREVENTIVO", () => {
  it("Tests AC-2: Given STATO_RIPARAZIONE and PREVENTIVO exist When filtering tipo=PREVENTIVO Then every row tipo is PREVENTIVO", async () => {
    await seedMixedNotifiche(30);

    const response = await request(app)
      .get("/api/notifiche?tipo=PREVENTIVO")
      .set("Authorization", authHeader("ADMIN", 7904));

    expect(response.status).toBe(200);
    const rows = response.body?.data ?? [];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row: { tipo?: string }) => row.tipo === "PREVENTIVO")).toBe(true);
  });

  it("Tests AC-2: Given mixed types When filtering PREVENTIVO Then STATO_RIPARAZIONE is excluded", async () => {
    await seedMixedNotifiche(30);

    const response = await request(app)
      .get("/api/notifiche?tipo=PREVENTIVO")
      .set("Authorization", authHeader("ADMIN", 7905));

    expect(response.status).toBe(200);
    const rows = response.body?.data ?? [];
    expect(rows.some((row: { tipo?: string }) => row.tipo === "STATO_RIPARAZIONE")).toBe(
      false,
    );
  });
});

describe("AC-3 - GET /api/notifiche?stato=FALLITA returns only FALLITA", () => {
  it("Tests AC-3: Given INVIATA and FALLITA exist When filtering stato=FALLITA Then every row stato is FALLITA", async () => {
    await seedMixedNotifiche(30);

    const response = await request(app)
      .get("/api/notifiche?stato=FALLITA")
      .set("Authorization", authHeader("ADMIN", 7906));

    expect(response.status).toBe(200);
    const rows = response.body?.data ?? [];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row: { stato?: string }) => row.stato === "FALLITA")).toBe(true);
  });

  it("Tests AC-3: Given mixed states When filtering FALLITA Then INVIATA is excluded", async () => {
    await seedMixedNotifiche(30);

    const response = await request(app)
      .get("/api/notifiche?stato=FALLITA")
      .set("Authorization", authHeader("ADMIN", 7907));

    expect(response.status).toBe(200);
    const rows = response.body?.data ?? [];
    expect(rows.some((row: { stato?: string }) => row.stato === "INVIATA")).toBe(false);
  });
});

describe("AC-4 - GET /api/notifiche filters by date range", () => {
  it("Tests AC-4: Given notifications inside and outside February 2026 When filtering dataDa/dataA Then only in-range rows are returned", async () => {
    vi.setSystemTime(new Date("2026-01-31T23:59:59.999Z"));
    await createPreventivoNotifica({
      preventivoId: 1,
      codiceRiparazione: "RIP-20260209-0001",
      destinatario: "before@test.it",
      voci: [{ tipo: "MANODOPERA", descrizione: "Pre", quantita: 1, prezzoUnitario: 10 }],
      subtotale: 10,
      iva: 2.2,
      totale: 12.2,
      allegatoPath: "docs/preventivi/preventivo-1.pdf",
      stato: "INVIATA",
    });

    vi.setSystemTime(new Date("2026-02-15T12:00:00.000Z"));
    await createPreventivoNotifica({
      preventivoId: 2,
      codiceRiparazione: "RIP-20260209-0002",
      destinatario: "in@test.it",
      voci: [{ tipo: "MANODOPERA", descrizione: "In", quantita: 1, prezzoUnitario: 10 }],
      subtotale: 10,
      iva: 2.2,
      totale: 12.2,
      allegatoPath: "docs/preventivi/preventivo-2.pdf",
      stato: "INVIATA",
    });

    vi.setSystemTime(new Date("2026-03-01T00:00:00.000Z"));
    await createPreventivoNotifica({
      preventivoId: 3,
      codiceRiparazione: "RIP-20260209-0003",
      destinatario: "after@test.it",
      voci: [{ tipo: "MANODOPERA", descrizione: "Post", quantita: 1, prezzoUnitario: 10 }],
      subtotale: 10,
      iva: 2.2,
      totale: 12.2,
      allegatoPath: "docs/preventivi/preventivo-3.pdf",
      stato: "INVIATA",
    });

    const response = await request(app)
      .get("/api/notifiche?dataDa=2026-02-01&dataA=2026-02-28")
      .set("Authorization", authHeader("ADMIN", 7908));

    expect(response.status).toBe(200);
    const rows = response.body?.data ?? [];
    expect(rows.length).toBe(1);
    expect(rows[0]?.destinatario).toBe("in@test.it");
  });

  it("Tests AC-4: Given boundary notifications on 2026-02-01 and 2026-02-28 When filtering range Then boundaries are included", async () => {
    vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
    await createPreventivoNotifica({
      preventivoId: 11,
      codiceRiparazione: "RIP-20260209-0011",
      destinatario: "start@test.it",
      voci: [{ tipo: "MANODOPERA", descrizione: "Start", quantita: 1, prezzoUnitario: 10 }],
      subtotale: 10,
      iva: 2.2,
      totale: 12.2,
      allegatoPath: "docs/preventivi/preventivo-11.pdf",
      stato: "INVIATA",
    });

    vi.setSystemTime(new Date("2026-02-28T23:59:59.999Z"));
    await createPreventivoNotifica({
      preventivoId: 12,
      codiceRiparazione: "RIP-20260209-0012",
      destinatario: "end@test.it",
      voci: [{ tipo: "MANODOPERA", descrizione: "End", quantita: 1, prezzoUnitario: 10 }],
      subtotale: 10,
      iva: 2.2,
      totale: 12.2,
      allegatoPath: "docs/preventivi/preventivo-12.pdf",
      stato: "INVIATA",
    });

    const response = await request(app)
      .get("/api/notifiche?dataDa=2026-02-01&dataA=2026-02-28")
      .set("Authorization", authHeader("ADMIN", 7909));

    expect(response.status).toBe(200);
    const destinatari = (response.body?.data ?? []).map(
      (row: { destinatario?: string }) => row.destinatario,
    );
    expect(destinatari).toContain("start@test.it");
    expect(destinatari).toContain("end@test.it");
  });

  it("Tests AC-4: Given invalid date query When filtering notifications Then invalid date is ignored safely", async () => {
    await seedMixedNotifiche(10);

    const response = await request(app)
      .get("/api/notifiche?dataDa=2026-02-99&dataA=2026-02-28")
      .set("Authorization", authHeader("ADMIN", 7912));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data)).toBe(true);
    expect(response.body?.data?.length).toBeGreaterThan(0);
  });

  it("Tests AC-4: Given dataDa greater than dataA When filtering notifications Then response contains empty data set", async () => {
    await seedMixedNotifiche(10);

    const response = await request(app)
      .get("/api/notifiche?dataDa=2026-03-01&dataA=2026-02-01")
      .set("Authorization", authHeader("ADMIN", 7913));

    expect(response.status).toBe(200);
    expect(response.body?.data).toEqual([]);
    expect(response.body?.meta?.total).toBe(0);
  });
});

describe("AC-5 - GET /api/notifiche is admin only", () => {
  it("Tests AC-5: Given role TECNICO When requesting /api/notifiche Then returns 403", async () => {
    const response = await request(app)
      .get("/api/notifiche")
      .set("Authorization", authHeader("TECNICO", 7910));

    expect(response.status).toBe(403);
    expect(response.body?.error?.code).toBe("FORBIDDEN");
  });

  it('Tests AC-5: Given role TECNICO When requesting /api/notifiche Then error message is "Admin only"', async () => {
    const response = await request(app)
      .get("/api/notifiche")
      .set("Authorization", authHeader("TECNICO", 7911));

    expect(response.status).toBe(403);
    expect(response.body?.error?.message).toBe("Admin only");
  });
});
