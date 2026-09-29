import { describe, it, expect } from "vitest";
import { mensajeEnUso, esErrorDeReferencia } from "../delete-guard";

describe("mensajeEnUso", () => {
  it("devuelve null si no hay usos", () => {
    expect(
      mensajeEnUso("el servicio", [{ cantidad: 0, singular: "propuesta", plural: "propuestas" }])
    ).toBeNull();
  });

  it("usa singular o plural según la cantidad", () => {
    expect(
      mensajeEnUso("el servicio", [{ cantidad: 1, singular: "propuesta", plural: "propuestas" }])
    ).toBe(
      "No se puede eliminar el servicio: está en uso en 1 propuesta. Podés desactivarlo desde Editar."
    );
    expect(
      mensajeEnUso("el servicio", [{ cantidad: 3, singular: "propuesta", plural: "propuestas" }])
    ).toContain("3 propuestas");
  });

  it("enumera varios usos omitiendo los que están en cero", () => {
    expect(
      mensajeEnUso("el item", [
        { cantidad: 2, singular: "propuesta", plural: "propuestas" },
        { cantidad: 0, singular: "servicio", plural: "servicios" },
        { cantidad: 1, singular: "tarea programada", plural: "tareas programadas" },
        { cantidad: 4, singular: "informe", plural: "informes" },
      ])
    ).toContain("en uso en 2 propuestas, 1 tarea programada y 4 informes.");
  });
});

describe("esErrorDeReferencia", () => {
  it("detecta la violación de FK de Prisma (P2003)", () => {
    expect(esErrorDeReferencia({ code: "P2003" })).toBe(true);
    expect(esErrorDeReferencia({ code: "P2025" })).toBe(false);
    expect(esErrorDeReferencia(new Error("x"))).toBe(false);
    expect(esErrorDeReferencia(null)).toBe(false);
  });
});
