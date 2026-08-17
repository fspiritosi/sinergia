import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiCuentaDialog } from "../mi-cuenta-dialog";

const sesion = {
  data: {
    user: {
      id: "user-1",
      name: "Ana Gómez",
      email: "ana@sinergia.local",
      image: null as string | null,
    },
  },
  refetch: vi.fn(),
};

vi.mock("@/lib/auth-client", () => ({
  useSession: () => sesion,
  authClient: { changePassword: vi.fn() },
}));

// Las server actions importan módulos server-only (R2, better-auth); en jsdom
// se mockean, porque lo que se prueba acá es el render del diálogo.
vi.mock("../account-actions", () => ({
  updateAvatarAction: vi.fn(),
  updateProfileAction: vi.fn(),
}));

beforeEach(() => {
  sesion.data.user.image = null;
});

describe("MiCuentaDialog", () => {
  it("no renderiza nada cuando está cerrado", () => {
    render(<MiCuentaDialog open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("Mi cuenta")).not.toBeInTheDocument();
  });

  it("muestra las tres pestañas", () => {
    render(<MiCuentaDialog open onOpenChange={() => {}} />);

    expect(screen.getByRole("tab", { name: "Perfil" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Contraseña" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Apariencia" })).toBeInTheDocument();
  });

  it("abre en Perfil, con el nombre editable y el email bloqueado", () => {
    render(<MiCuentaDialog open onOpenChange={() => {}} />);

    const nombre = screen.getByLabelText("Nombre");
    expect(nombre).toHaveValue("Ana Gómez");
    expect(nombre).toBeEnabled();

    // El email se muestra pero no se puede tocar: cambiarlo exigiría verificar
    // la casilla nueva por correo, que quedó fuera de alcance.
    const email = screen.getByDisplayValue("ana@sinergia.local");
    expect(email).toBeDisabled();
  });

  it("cae a las iniciales cuando el usuario no tiene foto", () => {
    render(<MiCuentaDialog open onOpenChange={() => {}} />);
    expect(screen.getAllByText("AG").length).toBeGreaterThan(0);
  });

  it("deja el botón de guardar deshabilitado hasta que se toca algo", () => {
    render(<MiCuentaDialog open onOpenChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });
});
