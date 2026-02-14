import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";
import { resetRateLimiter } from "../services/login-rate-limit.js";
import { resetAnagraficheStoreForTests } from "../services/anagrafiche-service.js";

beforeEach(() => {
  process.env.NODE_ENV = "test";
  resetRateLimiter();
  resetAnagraficheStoreForTests();
});

describe("AC-1 - POST /api/public/richieste valid payload", () => {
  it("Tests AC-1: Given an anonymous visitor submits POST /api/public/richieste with payload { tipo: PREVENTIVO, nome: Mario Rossi, email: mario@test.it, problema: Display rotto, consensoPrivacy: true } When backend validation passes and the request is persisted as a new public lead Then the API responds with HTTP 201 and body { data: { ticketId: LEAD-20260210-0001 } } with no error field", async () => {
    const response = await request(app).post("/api/public/richieste").send({
      tipo: "PREVENTIVO",
      nome: "Mario Rossi",
      email: "mario@test.it",
      problema: "Display rotto",
      consensoPrivacy: true,
    });

    expect(response.status).toBe(201);
    expect(response.body?.data?.ticketId).toBe("LEAD-20260210-0001");
  });

  it("Tests AC-1: Given the same valid request payload When response is returned Then no error field is present and ticketId is emitted in data", async () => {
    const response = await request(app).post("/api/public/richieste").send({
      tipo: "PREVENTIVO",
      nome: "Mario Rossi",
      email: "mario@test.it",
      problema: "Display rotto",
      consensoPrivacy: true,
    });

    expect(response.status).toBe(201);
    expect(response.body?.error).toBeUndefined();
    expect(typeof response.body?.data?.ticketId).toBe("string");
  });
});

describe("AC-2 - consensoPrivacy required", () => {
  it("Tests AC-2: Given an anonymous visitor submits POST /api/public/richieste with consensoPrivacy=false When the payload is validated by the public-request input parser Then the API responds with HTTP 400 and error.code=VALIDATION_ERROR indicating consensoPrivacy is mandatory and must be true", async () => {
    const response = await request(app).post("/api/public/richieste").send({
      tipo: "PREVENTIVO",
      nome: "Mario Rossi",
      email: "mario@test.it",
      problema: "Display rotto",
      consensoPrivacy: false,
    });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("Tests AC-2: Given consensoPrivacy is missing from request payload When POST /api/public/richieste is validated Then the API responds with HTTP 400 and VALIDATION_ERROR", async () => {
    const response = await request(app).post("/api/public/richieste").send({
      tipo: "PREVENTIVO",
      nome: "Mario Rossi",
      email: "mario@test.it",
      problema: "Display rotto",
    });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });
});

describe("AC-3 - rate limit on public richieste", () => {
  it("Tests AC-3: Given six POST /api/public/richieste attempts are sent from the same IP 203.0.113.44 within 60 seconds and policy allows at most 5 attempts per window When endpoint evaluates rate-limit state Then the sixth request responds with HTTP 429, Retry-After header, and error.code RATE_LIMIT_EXCEEDED", async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .post("/api/public/richieste")
        .set("X-Forwarded-For", "203.0.113.44")
        .send({
          tipo: "PREVENTIVO",
          nome: "Mario Rossi",
          email: "mario@test.it",
          problema: "Display rotto",
          consensoPrivacy: true,
          antispamToken: "invalid-token",
        });
    }

    const response = await request(app)
      .post("/api/public/richieste")
      .set("X-Forwarded-For", "203.0.113.44")
      .send({
        tipo: "PREVENTIVO",
        nome: "Mario Rossi",
        email: "mario@test.it",
        problema: "Display rotto",
        consensoPrivacy: true,
        antispamToken: "invalid-token",
      });

    expect(response.status).toBe(429);
    expect(response.body?.error?.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("Tests AC-3: Given response is throttled on sixth request When Retry-After header is inspected Then it is present and parseable as integer seconds", async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .post("/api/public/richieste")
        .set("X-Forwarded-For", "203.0.113.45")
        .send({
          tipo: "PREVENTIVO",
          nome: "Mario Rossi",
          email: "mario@test.it",
          problema: "Display rotto",
          consensoPrivacy: true,
          antispamToken: "invalid-token",
        });
    }

    const response = await request(app)
      .post("/api/public/richieste")
      .set("X-Forwarded-For", "203.0.113.45")
      .send({
        tipo: "PREVENTIVO",
        nome: "Mario Rossi",
        email: "mario@test.it",
        problema: "Display rotto",
        consensoPrivacy: true,
        antispamToken: "invalid-token",
      });

    const retryAfterHeader =
      (response.headers.retryafter as string | undefined) ??
      (response.headers["retry-after"] as string | undefined);
    const retryAfter = Number(retryAfterHeader);

    expect(response.status).toBe(429);
    expect(typeof retryAfterHeader).toBe("string");
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });
});

describe("AC-4 - invalid anti-spam token", () => {
  it("Tests AC-4: Given an anonymous visitor submits POST /api/public/richieste with payload including invalid anti-spam value When anti-spam verification rejects the payload before persistence Then API responds HTTP 400 and error.code INVALID_ANTISPAM_TOKEN without creating ticketId", async () => {
    const response = await request(app).post("/api/public/richieste").send({
      tipo: "PREVENTIVO",
      nome: "Mario Rossi",
      email: "mario@test.it",
      problema: "Display rotto",
      consensoPrivacy: true,
      antispamToken: "invalid-token",
    });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("INVALID_ANTISPAM_TOKEN");
  });

  it("Tests AC-4: Given invalid anti-spam token request When response payload is inspected Then ticketId is absent and error payload is present", async () => {
    const response = await request(app).post("/api/public/richieste").send({
      tipo: "PREVENTIVO",
      nome: "Mario Rossi",
      email: "mario@test.it",
      problema: "Display rotto",
      consensoPrivacy: true,
      antispamToken: "invalid-token",
    });

    expect(response.status).toBe(400);
    expect(response.body?.data?.ticketId).toBeUndefined();
    expect(response.body).toHaveProperty("error");
  });
});
