import { describe, it, expect } from "vitest";
import {
  cambiarPasswordSchema,
  perfilSchema,
  validarArchivoAvatar,
  AVATAR_MAX_BYTES,
} from "../cuenta.schema";

describe("cambiarPasswordSchema", () => {
  const valido = {
    currentPassword: "la-de-siempre",
    newPassword: "unaNueva123",
    confirmPassword: "unaNueva123",
  };

  it("acepta un cambio bien formado", () => {
    expect(cambiarPasswordSchema.safeParse(valido).success).toBe(true);
  });

  it("exige la contraseña actual", () => {
    const r = cambiarPasswordSchema.safeParse({ ...valido, currentPassword: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/actual/i);
  });

  it("rechaza una contraseña nueva de menos de 8 caracteres", () => {
    const r = cambiarPasswordSchema.safeParse({
      ...valido,
      newPassword: "corta1",
      confirmPassword: "corta1",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/8/);
  });

  it("rechaza cuando la repetición no coincide, y lo marca en ese campo", () => {
    const r = cambiarPasswordSchema.safeParse({ ...valido, confirmPassword: "otraCosa123" });
    expect(r.success).toBe(false);
    // El error tiene que caer en confirmPassword: si cae en la raíz, el formulario
    // no lo muestra debajo del campo y el usuario no entiende qué pasó.
    expect(r.error?.issues[0].path).toEqual(["confirmPassword"]);
    expect(r.error?.issues[0].message).toMatch(/coinciden/i);
  });

  it("rechaza que la nueva sea igual a la actual", () => {
    const r = cambiarPasswordSchema.safeParse({
      currentPassword: "unaNueva123",
      newPassword: "unaNueva123",
      confirmPassword: "unaNueva123",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/distinta/i);
  });
});

describe("perfilSchema", () => {
  it("acepta un nombre normal", () => {
    expect(perfilSchema.safeParse({ name: "Ana Gómez" }).success).toBe(true);
  });

  it("recorta los espacios", () => {
    const r = perfilSchema.safeParse({ name: "  Ana Gómez  " });
    expect(r.success && r.data.name).toBe("Ana Gómez");
  });

  it("rechaza un nombre vacío o de un solo carácter", () => {
    expect(perfilSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(perfilSchema.safeParse({ name: "A" }).success).toBe(false);
  });
});

describe("validarArchivoAvatar", () => {
  it("acepta jpeg, png y webp", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validarArchivoAvatar({ type, size: 1000 })).toBeNull();
    }
  });

  it("rechaza otros tipos", () => {
    expect(validarArchivoAvatar({ type: "application/pdf", size: 1000 })).toMatch(/JPG|PNG|WEBP/i);
    expect(validarArchivoAvatar({ type: "image/gif", size: 1000 })).toMatch(/JPG|PNG|WEBP/i);
  });

  it("rechaza archivos más grandes que el máximo", () => {
    expect(validarArchivoAvatar({ type: "image/png", size: AVATAR_MAX_BYTES + 1 })).toMatch(/MB/);
  });

  it("acepta justo el máximo", () => {
    expect(validarArchivoAvatar({ type: "image/png", size: AVATAR_MAX_BYTES })).toBeNull();
  });

  it("rechaza un archivo vacío", () => {
    expect(validarArchivoAvatar({ type: "image/png", size: 0 })).toMatch(/vacío/i);
  });
});
