import { Router } from "express";
import { listActivePublicServiceSlugs } from "../services/anagrafiche-service.js";

const seoRouter = Router();

const staticPublicRoutes = ["/", "/contatti", "/faq", "/richiedi-preventivo"] as const;

function resolvePublicSiteUrl(): string {
  const fromEnv = process.env.PUBLIC_SITE_URL?.trim();
  const baseUrl = fromEnv && fromEnv.length > 0 ? fromEnv : "http://localhost:5173";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemapXml(baseUrl: string): string {
  const serviceRoutes = listActivePublicServiceSlugs().map((slug) => `/servizi/${slug}`);
  const allRoutes = [...staticPublicRoutes, ...serviceRoutes];
  const rows = allRoutes
    .map((routePath) => `  <url><loc>${escapeXml(`${baseUrl}${routePath}`)}</loc></url>`)
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    rows,
    "</urlset>",
    "",
  ].join("\n");
}

seoRouter.get("/sitemap.xml", (_req, res) => {
  try {
    const baseUrl = resolvePublicSiteUrl();
    res.type("application/xml").status(200).send(buildSitemapXml(baseUrl));
  } catch {
    res.type("text/plain").status(500).send("Sitemap generation failed");
  }
});

seoRouter.get("/robots.txt", (_req, res) => {
  try {
    const baseUrl = resolvePublicSiteUrl();
    const body = ["User-agent: *", "Allow: /", `Sitemap: ${baseUrl}/sitemap.xml`, ""].join(
      "\n",
    );

    res.type("text/plain").status(200).send(body);
  } catch {
    res.type("text/plain").status(500).send("Robots policy unavailable");
  }
});

export { seoRouter };
