import { describe, it, expect } from "vitest";
import {
  parseCodigoNumero,
  nextCodigoNumero,
  formatCodigoPropuesta,
  PRIMER_NUMERO_PROPUESTA,
} from "../propuesta-codigo";

describe("parseCodigoNumero", () => {
  it("extracts the number when the code matches the year", () => {
    expect(parseCodigoNumero("2026-101", 2026)).toBe(101);
  });

  it("returns null when the year does not match", () => {
    expect(parseCodigoNumero("2026-101", 2027)).toBeNull();
  });

  it("returns null for a non-numeric suffix", () => {
    expect(parseCodigoNumero("2026-abc", 2026)).toBeNull();
  });

  it("returns null for free-form legacy codes", () => {
    expect(parseCodigoNumero("PROP-001", 2026)).toBeNull();
  });

  it("is anchored: does not match a code with extra leading digits", () => {
    expect(parseCodigoNumero("12026-101", 2026)).toBeNull();
  });
});

describe("nextCodigoNumero", () => {
  it("returns 101 when there are no codes for the year", () => {
    expect(nextCodigoNumero([], 2026)).toBe(101);
    expect(PRIMER_NUMERO_PROPUESTA).toBe(101);
  });

  it("returns max+1 for the current year", () => {
    expect(nextCodigoNumero(["2026-101", "2026-102"], 2026)).toBe(103);
  });

  it("ignores codes from other years", () => {
    expect(nextCodigoNumero(["2025-150", "2026-101"], 2026)).toBe(102);
  });

  it("ignores legacy free-form codes", () => {
    expect(nextCodigoNumero(["PROP-001", "ABC"], 2026)).toBe(101);
  });

  it("uses max+1 and does not fill gaps", () => {
    expect(nextCodigoNumero(["2026-101", "2026-105"], 2026)).toBe(106);
  });

  it("resets to 101 for a new year with no codes yet", () => {
    expect(nextCodigoNumero(["2026-101", "2026-180"], 2027)).toBe(101);
  });
});

describe("formatCodigoPropuesta", () => {
  it("formats as YEAR-NNN", () => {
    expect(formatCodigoPropuesta(2026, 101)).toBe("2026-101");
    expect(formatCodigoPropuesta(2027, 101)).toBe("2027-101");
  });
});
