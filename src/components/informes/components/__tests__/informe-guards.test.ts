import { describe, it, expect } from "vitest";
import {
  isInformeEjecutado,
  assertInformeEditable,
  INFORME_EJECUTADO_ERROR,
} from "../informe-guards";

describe("isInformeEjecutado", () => {
  it("returns true when estado is 'entregado'", () => {
    expect(isInformeEjecutado({ estado: "entregado" })).toBe(true);
  });

  it("returns false when estado is 'pendiente'", () => {
    expect(isInformeEjecutado({ estado: "pendiente" })).toBe(false);
  });
});

describe("assertInformeEditable", () => {
  it("does not throw for a pending informe", () => {
    expect(() => assertInformeEditable({ estado: "pendiente" })).not.toThrow();
  });

  it("throws with the ejecutado message for a delivered informe", () => {
    expect(() => assertInformeEditable({ estado: "entregado" })).toThrow(INFORME_EJECUTADO_ERROR);
  });
});
