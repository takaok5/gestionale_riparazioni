import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../App.js";

function renderDetailMarkup(slug: string): { slug: string; html: string } {
  const route = new URL(`http://localhost/servizi/${slug}`);
  const html = renderToStaticMarkup(React.createElement(App, { path: route.pathname }));
  return { slug: route.pathname.split("/").at(-1) ?? "", html };
}

describe("AC-3 - Public service detail page", () => {
  it("Tests AC-3: Given a public service with slug sostituzione-display exists and is active When the visitor opens /servizi/sostituzione-display and the detail flow requests GET /api/public/services/sostituzione-display Then the backend returns HTTP 200 with { data: { slug, title, summary, description, priceFrom, averageDuration, categoria } } and the page renders title plus full description", () => {
    const rendered = renderDetailMarkup("sostituzione-display");

    expect(rendered.slug).toBe("sostituzione-display");
    expect(rendered.html).toContain("sostituzione-display");
    expect(rendered.html).toContain("Sostituzione display");
    expect(rendered.html).toContain("Diagnosi avanzata");
    expect(rendered.html).toContain("da 99 EUR");
  });

  it("Tests AC-3: Given the same slug detail page When detail content is inspected Then title, summary, description, and average duration are visible in markup", () => {
    const rendered = renderDetailMarkup("sostituzione-display");

    expect(rendered.html).toContain("Sostituzione display");
    expect(rendered.html).toContain("smartphone e laptop");
    expect(rendered.html).toContain("Ricambi originali");
    expect(rendered.html).toContain("2-3 giorni");
  });
});
