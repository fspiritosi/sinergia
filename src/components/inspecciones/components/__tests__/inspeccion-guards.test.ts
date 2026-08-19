import { describe, it, expect } from "vitest";
import {
  isInspeccionFinalizada,
  assertInspeccionEliminable,
  INSPECCION_FINALIZADA_ERROR,
  isInspeccionEditable,
  assertInspeccionEditable,
  INSPECCION_NO_EDITABLE_ERROR,
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

describe("isInspeccionEditable", () => {
  it("returns true for a draft inspeccion without the finalizada permission", () => {
    expect(isInspeccionEditable({ estado: "borrador" })).toBe(true);
  });

  it("returns false for a completed inspeccion without the finalizada permission", () => {
    expect(isInspeccionEditable({ estado: "completada" })).toBe(false);
  });

  it("returns true for a completed inspeccion when the user can edit finalizadas", () => {
    expect(isInspeccionEditable({ estado: "completada" }, { canEditFinalizada: true })).toBe(true);
  });
});

describe("assertInspeccionEditable", () => {
  it("does not throw for a draft inspeccion", () => {
    expect(() => assertInspeccionEditable({ estado: "borrador" })).not.toThrow();
  });

  it("throws with the no-editable message for a completed inspeccion without permission", () => {
    expect(() => assertInspeccionEditable({ estado: "completada" })).toThrow(
      INSPECCION_NO_EDITABLE_ERROR
    );
  });

  it("does not throw for a completed inspeccion when the user can edit finalizadas", () => {
    expect(() =>
      assertInspeccionEditable({ estado: "completada" }, { canEditFinalizada: true })
    ).not.toThrow();
  });

  it("throws for a completed inspeccion when canEditFinalizada is explicitly false", () => {
    expect(() =>
      assertInspeccionEditable({ estado: "completada" }, { canEditFinalizada: false })
    ).toThrow(INSPECCION_NO_EDITABLE_ERROR);
  });
});
