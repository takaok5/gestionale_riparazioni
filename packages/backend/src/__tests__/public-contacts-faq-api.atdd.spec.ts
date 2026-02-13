import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import {
  resetAnagraficheStoreForTests,
  seedPublicPageContentForTests,
} from "../services/anagrafiche-service.js";

beforeEach(() => {
  process.env.NODE_ENV = "test";
  resetAnagraficheStoreForTests();
});

describe("AC-1 - GET /api/public/pages/contatti", () => {
  it("Tests AC-1: Given public contact config contains phone=+39 02 1234 5678, email=info@centrotest.it, openingHours=Lun-Ven 09:00-18:30; Sab 09:00-13:00, and mapPlaceholder=MAP_EMBED_PENDING When an anonymous visitor requests GET /api/public/pages/contatti Then API returns HTTP 200 and data payload with contatti fields", async () => {
    const response = await request(app).get("/api/public/pages/contatti");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("phone");
    expect(response.body.data).toHaveProperty("email");
    expect(response.body.data).toHaveProperty("openingHours");
    expect(response.body.data).toHaveProperty("mapPlaceholder");
  });

  it("Tests AC-1: Given same endpoint response When contact fields are inspected Then phone/email/openingHours/mapPlaceholder match exact configured literals", async () => {
    const response = await request(app).get("/api/public/pages/contatti");

    expect(response.status).toBe(200);
    expect(response.body?.data?.phone).toBe("+39 02 1234 5678");
    expect(response.body?.data?.email).toBe("info@centrotest.it");
    expect(response.body?.data?.openingHours).toBe("Lun-Ven 09:00-18:30; Sab 09:00-13:00");
    expect(response.body?.data?.mapPlaceholder).toBe("Mappa in aggiornamento");
  });
});

describe("AC-2 - GET /api/public/faq", () => {
  it("Tests AC-2: Given FAQ public data contains categories Accettazione and Preventivi with configured entries When an anonymous visitor requests GET /api/public/faq Then API returns HTTP 200 with grouped FAQ rows", async () => {
    const response = await request(app).get("/api/public/faq");
    const rows = response.body?.data as Array<{ category?: string; question?: string; answer?: string }>;

    expect(response.status).toBe(200);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.some((row) => row.category === "Accettazione")).toBe(true);
    expect(rows.some((row) => row.category === "Preventivi")).toBe(true);
  });

  it("Tests AC-2: Given FAQ endpoint response When searching entry Il preventivo e gratuito? Then exact configured answer Si, salvo guasti non standard is returned", async () => {
    const response = await request(app).get("/api/public/faq");
    const rows = response.body?.data as Array<{ question?: string; answer?: string }>;
    const target = rows.find((row) => row.question === "Il preventivo e gratuito?");

    expect(response.status).toBe(200);
    expect(target).toBeDefined();
    expect(target?.answer).toBe("Si, salvo guasti non standard");
  });
});

describe("AC-3 - Public config refresh without frontend code changes", () => {
  it("Tests AC-3: Given config phone is updated to +39 02 7654 3210 and endpoints expose updated payload When an anonymous visitor requests GET /api/public/pages/contatti after refresh Then response includes updated phone", async () => {
    seedPublicPageContentForTests({
      contacts: {
        phone: "+39 02 7654 3210",
      },
    });

    const response = await request(app).get("/api/public/pages/contatti");

    expect(response.status).toBe(200);
    expect(response.body?.data?.phone).toBe("+39 02 7654 3210");
  });

  it("Tests AC-3: Given FAQ answer Il preventivo e gratuito? is updated to Si, sempre and endpoint exposes updated payload When an anonymous visitor requests GET /api/public/faq after refresh Then updated answer is returned", async () => {
    seedPublicPageContentForTests({
      faqAnswerByQuestion: [
        {
          question: "Il preventivo e gratuito?",
          answer: "Si, sempre",
        },
      ],
    });

    const response = await request(app).get("/api/public/faq");
    const rows = response.body?.data as Array<{ question?: string; answer?: string }>;
    const target = rows.find((row) => row.question === "Il preventivo e gratuito?");

    expect(response.status).toBe(200);
    expect(target?.answer).toBe("Si, sempre");
  });
});

describe("AC-5 - Sad path unsupported page slug", () => {
  it("Tests AC-5: Given an anonymous visitor requests GET /api/public/pages/slug-non-supportato When backend handles /api/public/pages/:slug with unsupported slug Then API responds HTTP 404 with error.code PAGE_NOT_FOUND", async () => {
    const response = await request(app).get("/api/public/pages/slug-non-supportato");

    expect(response.status).toBe(404);
    expect(response.body?.error?.code).toBe("PAGE_NOT_FOUND");
  });

  it("Tests AC-5: Given unsupported slug request When API returns 404 Then deterministic error payload contains error.message and no data field", async () => {
    const response = await request(app).get("/api/public/pages/slug-non-supportato");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(typeof response.body?.error?.message).toBe("string");
    expect(response.body?.data).toBeUndefined();
  });
});
