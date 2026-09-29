import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("../inspeccion-actions", () => ({
  uploadImagenRespuesta: vi.fn(),
  deleteImagenRespuesta: vi.fn(),
}));
vi.mock("@/lib/compress-image", () => ({ compressImage: vi.fn() }));

import { InspeccionPregunta, type PreguntaData, type RespuestaLocal } from "../inspeccion-pregunta";

const pregunta: PreguntaData = {
  id: "p1",
  codigo: "1.1",
  texto: "¿Hay derrames?",
  acciones: [],
  condicionRespuesta: null,
};

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

function renderPregunta(respuestas: Map<string, RespuestaLocal>, readOnly = false) {
  const props = {
    pregunta,
    readOnly,
    onSave: vi.fn(),
    savingIds: new Set<string>(),
    formularioId: "f1",
    onImageUploaded: vi.fn(),
    onImageDeleted: vi.fn(),
  };
  const utils = render(<InspeccionPregunta {...props} respuestas={respuestas} />, { wrapper });
  return {
    ...utils,
    props,
    rerenderWith: (next: Map<string, RespuestaLocal>) =>
      utils.rerender(<InspeccionPregunta {...props} respuestas={next} />),
  };
}

const conObservaciones = new Map<string, RespuestaLocal>([
  ["p1", { valor: "no", observaciones: "Derrame en sector B", accionIds: [], imagenes: [] }],
]);

describe("InspeccionPregunta — observaciones", () => {
  it("muestra las observaciones guardadas sin tener que desplegarlas", () => {
    renderPregunta(conObservaciones, true);
    expect(screen.getByDisplayValue("Derrame en sector B")).toBeInTheDocument();
  });

  it("muestra las observaciones que llegan después del primer render", () => {
    // El formulario monta las preguntas con el mapa vacío y lo completa en un efecto.
    const { rerenderWith } = renderPregunta(new Map());
    rerenderWith(conObservaciones);
    expect(screen.getByDisplayValue("Derrame en sector B")).toBeInTheDocument();
  });

  it("no borra las observaciones existentes al cambiar la respuesta", () => {
    const { rerenderWith, props } = renderPregunta(new Map());
    rerenderWith(conObservaciones);
    screen.getByRole("button", { name: "NA" }).click();
    expect(props.onSave).toHaveBeenCalledWith("p1", "na", "Derrame en sector B", []);
  });
});
