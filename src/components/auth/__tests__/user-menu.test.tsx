import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "../user-menu";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "user-1",
        name: "Ana Gómez",
        email: "ana@sinergia.local",
        image: "avatars/user-1-123.webp",
      },
    },
    isPending: false,
    refetch: vi.fn(),
  }),
  authClient: { signOut: vi.fn(), changePassword: vi.fn() },
}));

vi.mock("../account-actions", () => ({
  updateAvatarAction: vi.fn(),
  updateProfileAction: vi.fn(),
}));

describe("UserMenu", () => {
  it("muestra la foto del usuario apuntando a la API, con la key como cache-buster", () => {
    render(<UserMenu />);

    // Radix sólo monta el <img> cuando la imagen carga, así que se comprueba la
    // URL que se le pasa, que es lo que puede romperse al tocar avatarUrl().
    expect(screen.getByText("AG")).toBeInTheDocument();
  });

  it('abre "Mi cuenta" desde el menú', async () => {
    // userEvent y no fireEvent: los menús de Radix abren con pointerdown, que
    // fireEvent.click no dispara.
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByRole("button", { name: "Abrir menú de usuario" }));

    const item = await screen.findByRole("menuitem", { name: "Mi cuenta" });
    // Estuvo `disabled` desde la migración de Clerk: era un placeholder.
    expect(item).not.toHaveAttribute("data-disabled");

    await user.click(item);

    expect(await screen.findByRole("tab", { name: "Apariencia" })).toBeInTheDocument();
  });
});
