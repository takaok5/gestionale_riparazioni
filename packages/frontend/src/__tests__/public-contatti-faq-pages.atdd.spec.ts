import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../App.js";

function renderPath(path: string): string {
  return renderToStaticMarkup(React.createElement(App, { path }));
}

describe("AC-1 - Pagina /contatti", () => {
  it("Tests AC-1: Given public contact config has phone/email/openingHours/mapPlaceholder When an anonymous visitor opens /contatti Then markup contains clickable tel/mailto and exact opening hours", () => {
    const html = renderPath("/contatti");

    expect(html).toContain("tel:+390212345678");
    expect(html).toContain("mailto:info@centrotest.it");
    expect(html).toContain("Lun-Ven 09:00-18:30; Sab 09:00-13:00");
  });

  it("Tests AC-1: Given /contatti markup When map section is inspected Then placeholder text Mappa in aggiornamento is visible", () => {
    const html = renderPath("/contatti");

    expect(html).toContain("Mappa in aggiornamento");
    expect(html).toContain("Contatti");
  });
});

describe("AC-2 - Pagina /faq", () => {
  it("Tests AC-2: Given FAQ public data contains categories Accettazione and Preventivi When an anonymous visitor opens /faq Then page shows both category headers and question labels", () => {
    const html = renderPath("/faq");

    expect(html).toContain("Accettazione");
    expect(html).toContain("Preventivi");
    expect(html).toContain("Quanto dura una diagnosi?");
    expect(html).toContain("Il preventivo e gratuito?");
  });

  it("Tests AC-2: Given /faq page When question Il preventivo e gratuito? is expanded Then exact answer Si, salvo guasti non standard is present", () => {
    const html = renderPath("/faq");

    expect(html).toContain("Si, salvo guasti non standard");
  });
});

describe("AC-4 - Navigazione / -> /faq -> /", () => {
  it("Tests AC-4: Given visitor reaches /faq from home link FAQ When FAQ page renders Then breadcrumb Home / FAQ and title FAQ are shown", () => {
    const html = renderPath("/faq");

    expect(html).toContain(">Home</a> / FAQ");
    expect(html).toContain(">FAQ<");
  });

  it("Tests AC-4: Given FAQ page has breadcrumb Home When visitor uses breadcrumb to return Then link to / exists and home title remains Riparazioni rapide e trasparenti", () => {
    const faqHtml = renderPath("/faq");
    const homeHtml = renderPath("/");

    expect(faqHtml).toContain('href="/"');
    expect(homeHtml).toContain("Riparazioni rapide e trasparenti");
  });
});
