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

  it("throws with the finalizada message for a completed inspeccion", () => {
    expect(() => assertInspeccionEliminable({ estado: "completada" })).toThrow(
      INSPECCION_FINALIZADA_ERROR
    );
  });
});
