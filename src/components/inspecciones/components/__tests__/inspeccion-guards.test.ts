import { describe, it, expect } from "vitest";
import {
  isInspeccionFinalizada,
  assertInspeccionEliminable,
  INSPECCION_FINALIZADA_ERROR,
} from "../inspeccion-guards";

describe("isInspeccionFinalizada", () => {
  it("returns true when estado is 'completada'", () => {
    expect(isInspeccionFinalizada({ estado: "completada" })).toBe(true);
  });

  it("returns false when estado is 'borrador'", () => {
    expect(isInspeccionFinalizada({ estado: "borrador" })).toBe(false);
  });
});

describe("assertInspeccionEliminable", () => {
  it("does not throw for a draft inspeccion", () => {
    expect(() => assertInspeccionEliminable({ estado: "borrador" })).not.toThrow();
  });

  it("throws with the finalizada message for a completed inspeccion when not admin", () => {
    expect(() => assertInspeccionEliminable({ estado: "completada" })).toThrow(
      INSPECCION_FINALIZADA_ERROR
    );
  });

  it("does not throw for a completed inspeccion when the user is admin", () => {
    expect(() =>
      assertInspeccionEliminable({ estado: "completada" }, { isAdmin: true })
    ).not.toThrow();
  });

  it("throws for a completed inspeccion when the user is not admin (explicit)", () => {
    expect(() => assertInspeccionEliminable({ estado: "completada" }, { isAdmin: false })).toThrow(
      INSPECCION_FINALIZADA_ERROR
    );
  });
});
