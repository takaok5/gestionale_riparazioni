import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../index.js";

describe("AC-1 - Public services list", () => {
  it("Tests AC-1: Given the catalog contains 8 services with attivo=true and each record includes slug, title, summary, priceFrom, and averageDuration When an anonymous user sends GET /api/public/services Then the API returns HTTP 200 with body { data: [...] }, data.length=8, and each item includes slug, title, summary, priceFrom, and averageDuration", async () => {
    const response = await request(app).get("/api/public/services");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body?.data)).toBe(true);
    expect(response.body.data).toHaveLength(8);
  });

  it("Tests AC-1: Given the same endpoint response When inspecting the first card Then slug/title/summary/priceFrom/averageDuration are all present", async () => {
    const response = await request(app).get("/api/public/services");
    const first = response.body?.data?.[0] as Record<string, unknown> | undefined;

    expect(response.status).toBe(200);
    expect(first).toBeDefined();
    expect(first).toHaveProperty("slug");
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("summary");
    expect(first).toHaveProperty("priceFrom");
    expect(first).toHaveProperty("averageDuration");
  });
});

describe("AC-2 - Public services category filter", () => {
  it("Tests AC-2: Given the public catalog contains services in categories smartphone and laptop When an anonymous user sends GET /api/public/services?categoria=smartphone Then the API returns HTTP 200 with body { data: [...] } where every item has categoria=smartphone and no laptop items are present", async () => {
    const response = await request(app).get("/api/public/services?categoria=smartphone");
    const rows = (response.body?.data ?? []) as Array<{ categoria?: string }>;

    expect(response.status).toBe(200);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.categoria === "smartphone")).toBe(true);
  });

  it("Tests AC-2: Given smartphone filter response When scanning results Then no item has categoria=laptop", async () => {
    const response = await request(app).get("/api/public/services?categoria=smartphone");
    const rows = (response.body?.data ?? []) as Array<{ categoria?: string }>;

    expect(response.status).toBe(200);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.some((row) => row.categoria === "laptop")).toBe(false);
  });
});

describe("AC-4 - Inactive service slug", () => {
  it("Tests AC-4: Given a service exists with slug riparazione-legacy and is marked attivo=false When the visitor requests GET /api/public/services/riparazione-legacy Then the API returns HTTP 404 with error.code=SERVICE_NOT_FOUND and does not expose any service detail payload", async () => {
    const response = await request(app).get("/api/public/services/riparazione-legacy");

    expect(response.status).toBe(404);
    expect(response.body?.error?.code).toBe("SERVICE_NOT_FOUND");
    expect(response.body?.data).toBeUndefined();
  });

  it("Tests AC-4: Given inactive slug request When receiving 404 Then response has deterministic error payload", async () => {
    const response = await request(app).get("/api/public/services/riparazione-legacy");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toHaveProperty("message");
  });
});
