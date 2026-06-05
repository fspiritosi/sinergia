import { describe, it, expect } from "vitest";
import {
  isProgramacionEjecutada,
  assertProgramacionEditable,
  PROGRAMACION_EJECUTADA_ERROR,
} from "../programacion-guards";

describe("isProgramacionEjecutada", () => {
  it("returns false when ejecutadoAt is null and there is no informe", () => {
    expect(isProgramacionEjecutada({ ejecutadoAt: null, informe: null })).toBe(false);
  });

  it("returns true when ejecutadoAt is set", () => {
    expect(isProgramacionEjecutada({ ejecutadoAt: new Date(), informe: null })).toBe(true);
  });

  it("returns true when the associated informe is entregado with an adjunto", () => {
    expect(
      isProgramacionEjecutada({
        ejecutadoAt: null,
        informe: { estado: "entregado", adjunto: "informes/abc" },
      })
    ).toBe(true);
  });

  it("returns false when the informe is entregado but has no adjunto", () => {
    expect(
      isProgramacionEjecutada({
        ejecutadoAt: null,
        informe: { estado: "entregado", adjunto: null },
      })
    ).toBe(false);
  });

  it("returns false when the informe is still pendiente", () => {
    expect(
      isProgramacionEjecutada({
        ejecutadoAt: null,
        informe: { estado: "pendiente", adjunto: null },
      })
    ).toBe(false);
  });
});

describe("assertProgramacionEditable", () => {
  it("does not throw for a non-executed programacion", () => {
    expect(() => assertProgramacionEditable({ ejecutadoAt: null, informe: null })).not.toThrow();
  });

  it("throws with the ejecutada message for an executed programacion", () => {
    expect(() => assertProgramacionEditable({ ejecutadoAt: new Date(), informe: null })).toThrow(
      PROGRAMACION_EJECUTADA_ERROR
    );
  });
});
