import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../App.js";

function renderPathMarkup(path: string): string {
  return renderToStaticMarkup(React.createElement(App, { path }));
}

describe("AC-1 - SEO metadata for public pages", () => {
  it("Tests AC-1: Given route / When public page HTML is rendered Then title and meta description are route specific", () => {
    const html = renderPathMarkup("/");

    expect(html).toContain("<title>Gestionale Riparazioni | Assistenza dispositivi</title>");
    expect(html).toContain('<meta name="description"');
    expect(html).toContain("Riparazioni rapide e trasparenti");
  });

  it("Tests AC-1: Given routes /contatti and /faq When metadata is inspected Then titles are unique and both pages expose description", () => {
    const contattiHtml = renderPathMarkup("/contatti");
    const faqHtml = renderPathMarkup("/faq");

    expect(contattiHtml).toContain("<title>Contatti | Gestionale Riparazioni</title>");
    expect(faqHtml).toContain("<title>FAQ | Gestionale Riparazioni</title>");
    expect(contattiHtml).toContain('<meta name="description"');
    expect(faqHtml).toContain('<meta name="description"');
  });
});

describe("AC-2 - Canonical and Open Graph on service detail", () => {
  it("Tests AC-2: Given /servizi/sostituzione-display When SEO metadata is rendered Then canonical and og tags are present", () => {
    const html = renderPathMarkup("/servizi/sostituzione-display");

    expect(html).toContain('<link rel="canonical" href="http://localhost:5173/servizi/sostituzione-display"');
    expect(html).toContain('<meta property="og:title" content="Sostituzione display | Gestionale Riparazioni"');
    expect(html).toContain('<meta property="og:type" content="website"');
  });

  it("Tests AC-2: Given service detail metadata When og:url and description are inspected Then values match canonical and service summary", () => {
    const html = renderPathMarkup("/servizi/sostituzione-display");

    expect(html).toContain('<meta property="og:url" content="http://localhost:5173/servizi/sostituzione-display"');
    expect(html).toContain('<meta property="og:description" content="Diagnosi avanzata e sostituzione display');
  });
});
