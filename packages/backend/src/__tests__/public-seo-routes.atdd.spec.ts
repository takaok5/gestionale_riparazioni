import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "../index.js";

const originalPublicSiteUrl = process.env.PUBLIC_SITE_URL;

beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.PUBLIC_SITE_URL = "http://localhost:5173";
});

afterEach(() => {
  process.env.PUBLIC_SITE_URL = originalPublicSiteUrl;
});

describe("AC-3 - GET /sitemap.xml", () => {
  it("Tests AC-3: Given active service slugs include sostituzione-display When client requests /sitemap.xml Then response is XML with public routes", async () => {
    const response = await request(app).get("/sitemap.xml");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/xml");
    expect(response.text).toContain("<urlset");
    expect(response.text).toContain("http://localhost:5173/");
    expect(response.text).toContain("http://localhost:5173/contatti");
    expect(response.text).toContain("http://localhost:5173/faq");
    expect(response.text).toContain("http://localhost:5173/richiedi-preventivo");
  });

  it("Tests AC-3: Given inactive slug riparazione-legacy exists When sitemap is generated Then active slug is included and inactive slug is excluded", async () => {
    const response = await request(app).get("/sitemap.xml");

    expect(response.status).toBe(200);
    expect(response.text).toContain("http://localhost:5173/servizi/sostituzione-display");
    expect(response.text).not.toContain("http://localhost:5173/servizi/riparazione-legacy");
  });
});

describe("AC-4 - GET /robots.txt", () => {
  it("Tests AC-4: Given crawler policy endpoint is public When client requests /robots.txt Then response is plain text with allow and sitemap directives", async () => {
    const response = await request(app).get("/robots.txt");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.text).toContain("User-agent: *");
    expect(response.text).toContain("Allow: /");
    expect(response.text).toContain("Sitemap: http://localhost:5173/sitemap.xml");
  });

  it("Tests AC-4: Given robots response When policy lines are parsed Then there are no disallow directives for public pages", async () => {
    const response = await request(app).get("/robots.txt");

    expect(response.status).toBe(200);
    expect(response.text).not.toContain("Disallow: /");
    expect(response.text.split("\n").length).toBeGreaterThanOrEqual(3);
  });
});
