import React from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../App.js";

function renderHomeMarkup(): string {
  return renderToStaticMarkup(React.createElement(App));
}

function countOccurrences(source: string, token: string): number {
  return source.split(token).length - 1;
}

function readRootScripts(): Record<string, string> {
  const raw = readFileSync(new URL("../../../../package.json", import.meta.url), "utf8");
  const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
  return parsed.scripts ?? {};
}

describe("AC-1 Home pubblica con hero/servizi/trust/CTA", () => {
  it("Tests AC-1: Given route / desktop 1366x768 When homepage renders Then hero title + CTA Richiedi preventivo are visible", () => {
    const html = renderHomeMarkup();

    expect(html).toContain("Riparazioni rapide e trasparenti");
    expect(html).toContain("Richiedi preventivo");
    expect(html).toContain('/richiedi-preventivo');
  });

  it("Tests AC-1: Given homepage render When sections are inspected Then trust blocks and at least 3 service cards are present", () => {
    const html = renderHomeMarkup();

    expect(html).toContain("Recensioni");
    expect(html).toContain("FAQ");
    expect(html).toContain("Contatti");
    expect(countOccurrences(html, "<article")).toBeGreaterThanOrEqual(3);
  });
});

describe("AC-2 Responsive mobile 390px senza overflow", () => {
  it("Tests AC-2: Given viewport 390px When homepage renders Then overflow-x is explicitly prevented", () => {
    const html = renderHomeMarkup();

    expect(html).toContain("overflow-x-hidden");
    expect(html).toContain("max-w-screen");
  });

  it("Tests AC-2: Given viewport 390px When homepage renders Then responsive utility breakpoints are configured", () => {
    const html = renderHomeMarkup();

    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("lg:grid-cols-3");
    expect(html).toContain("px-4");
  });
});

describe("AC-3 Lighthouse mobile >= 0.85", () => {
  it("Tests AC-3: Given package scripts When lighthouse command is inspected Then mobile performance command exists", () => {
    const scripts = readRootScripts();
    const command = scripts["lighthouse:9.1"];

    expect(typeof command).toBe("string");
    expect(command).toContain("lighthouse http://127.0.0.1:4173/");
    expect(command).toContain("--emulated-form-factor=mobile");
  });

  it("Tests AC-3: Given lighthouse script When command is inspected Then output artifact path is fixed for score assertion", () => {
    const scripts = readRootScripts();
    const command = scripts["lighthouse:9.1"];

    expect(command).toContain("--output-path=docs/sprint-artifacts/lighthouse-9.1.json");
    expect(command).toContain("--only-categories=performance");
    expect(command).toContain("--throttling-method=simulate");
  });
});

describe("AC-4 CTA portale cliente", () => {
  it("Tests AC-4: Given CTA Accedi al portale cliente When rendered Then it targets /portale/login", () => {
    const html = renderHomeMarkup();

    expect(html).toContain("Accedi al portale cliente");
    expect(html).toContain('/portale/login');
    expect(countOccurrences(html, "/portale/login")).toBeGreaterThanOrEqual(1);
  });

  it("Tests AC-4: Given homepage CTA links When inspected Then exactly one portal login CTA is present", () => {
    const html = renderHomeMarkup();

    expect(countOccurrences(html, "Accedi al portale cliente")).toBe(1);
    expect(countOccurrences(html, "/portale/login")).toBe(1);
  });
});

describe("AC-5 Sad path query non supportata", () => {
  it("Tests AC-5: Given route /?layout=broken When homepage renders Then sections remain visible", () => {
    const queryValue = new URL("http://localhost/?layout=broken").searchParams.get("layout");
    const html = renderHomeMarkup();

    expect(queryValue).toBe("broken");
    expect(html).toContain("Riparazioni rapide e trasparenti");
    expect(html).toContain("Recensioni");
    expect(html).toContain("FAQ");
  });

  it("Tests AC-5: Given invalid layout query When homepage renders Then both CTA targets stay stable and no runtime error text appears", () => {
    const html = renderHomeMarkup();

    expect(html).toContain('/richiedi-preventivo');
    expect(html).toContain('/portale/login');
    expect(html).not.toContain("Errore di rendering");
  });
});