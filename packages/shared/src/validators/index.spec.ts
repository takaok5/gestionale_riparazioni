import { describe, expect, it } from "vitest";
import {
  isValidCAP,
  isValidCodiceFiscale,
  isValidPartitaIva,
  isValidProvincia,
} from "./index";

describe("shared validators", () => {
  it("accepts partita IVA with 11 numeric digits", () => {
    expect(isValidPartitaIva("12345678901")).toBe(true);
  });

  it("rejects partita IVA with invalid length", () => {
    expect(isValidPartitaIva("123")).toBe(false);
  });

  it("keeps codice fiscale format validation", () => {
    expect(isValidCodiceFiscale("RSSMRA80A01H501U")).toBe(true);
    expect(isValidCodiceFiscale("INVALID")).toBe(false);
  });

  it("validates CAP and provincia formats", () => {
    expect(isValidCAP("20100")).toBe(true);
    expect(isValidCAP("20A00")).toBe(false);
    expect(isValidProvincia("MI")).toBe(true);
    expect(isValidProvincia("M")).toBe(false);
  });
});
