import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMailMock = vi.fn().mockResolvedValue({ messageId: "msg-1" });
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

vi.mock("@/lib/env", () => ({
  env: {
    SMTP_HOST: "smtp.test.local",
    SMTP_PORT: 465,
    SMTP_SECURE: true,
    SMTP_USER: "user@test.local",
    SMTP_PASS: "secret",
    SMTP_FROM: "Sinergia <no-reply@test.local>",
  },
}));

beforeEach(() => {
  sendMailMock.mockClear();
  createTransportMock.mockClear();
  vi.resetModules();
});

describe("sendMail", () => {
  it("envía con from, to, subject y html", async () => {
    const { sendMail } = await import("../mailer");

    await sendMail({ to: "destino@test.local", subject: "Hola", html: "<p>Contenido</p>" });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const arg = sendMailMock.mock.calls[0][0];
    expect(arg.to).toBe("destino@test.local");
    expect(arg.subject).toBe("Hola");
    expect(arg.html).toContain("Contenido");
    expect(arg.from).toBe("Sinergia <no-reply@test.local>");
  });

  it("deriva un text plano cuando no se pasa, para mejorar la entrega", async () => {
    const { sendMail } = await import("../mailer");

    await sendMail({ to: "destino@test.local", subject: "Hola", html: "<p>Hola <b>Ana</b></p>" });

    const arg = sendMailMock.mock.calls[0][0];
    expect(arg.text).toBe("Hola Ana");
  });

  it("respeta el text explícito si se provee", async () => {
    const { sendMail } = await import("../mailer");

    await sendMail({
      to: "destino@test.local",
      subject: "Hola",
      html: "<p>Ignorado</p>",
      text: "Texto propio",
    });

    expect(sendMailMock.mock.calls[0][0].text).toBe("Texto propio");
  });

  it("propaga el error cuando el envío falla", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP caído"));
    const { sendMail } = await import("../mailer");

    await expect(
      sendMail({ to: "destino@test.local", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow("SMTP caído");
  });

  it("configura el transporte con los valores de env", async () => {
    const { sendMail } = await import("../mailer");
    await sendMail({ to: "a@b.c", subject: "s", html: "<p>h</p>" });

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.test.local",
        port: 465,
        secure: true,
        auth: { user: "user@test.local", pass: "secret" },
      })
    );
  });

  it("falla si el servidor aceptó la conexión pero rechazó al destinatario", async () => {
    sendMailMock.mockResolvedValueOnce({
      messageId: "msg-2",
      accepted: [],
      rejected: ["destino@test.local"],
      response: "550 mailbox unavailable",
    });
    const { sendMail } = await import("../mailer");

    await expect(
      sendMail({ to: "destino@test.local", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow(/rechaz/i);
  });
});

/**
 * Este registro existe porque better-auth atrapa las excepciones de sus
 * callbacks de correo y responde igual con status:true. Sin él, una invitación
 * con el SMTP caído se ve como un alta exitosa.
 */
describe("registro de fallos de envío", () => {
  it("anota el fallo del destinatario cuando el envío falla", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP caído"));
    const { sendMail, tomarFalloDeEnvio } = await import("../mailer");

    await expect(
      sendMail({ to: "destino@test.local", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow();

    expect(tomarFalloDeEnvio("destino@test.local")).toContain("SMTP caído");
  });

  it("no deja nada anotado cuando el envío sale bien", async () => {
    const { sendMail, tomarFalloDeEnvio } = await import("../mailer");

    await sendMail({ to: "destino@test.local", subject: "X", html: "<p>X</p>" });

    expect(tomarFalloDeEnvio("destino@test.local")).toBeUndefined();
  });

  it("se consume una sola vez, para que no contamine un envío posterior", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP caído"));
    const { sendMail, tomarFalloDeEnvio } = await import("../mailer");

    await expect(
      sendMail({ to: "a@test.local", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow();

    expect(tomarFalloDeEnvio("a@test.local")).toBeDefined();
    expect(tomarFalloDeEnvio("a@test.local")).toBeUndefined();
  });

  it("no confunde destinatarios distintos ni se pierde por mayúsculas", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP caído"));
    const { sendMail, tomarFalloDeEnvio } = await import("../mailer");

    await expect(
      sendMail({ to: "Ana@Test.local", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow();

    expect(tomarFalloDeEnvio("otro@test.local")).toBeUndefined();
    expect(tomarFalloDeEnvio("ana@test.local")).toBeDefined();
  });

  it("traduce el error de autenticación a algo accionable", async () => {
    // Es el fallo real que dejó sin invitaciones al sistema: la contraseña SMTP
    // llegó truncada a Dokploy y Hostinger devolvió 535.
    const eauth = Object.assign(new Error("Invalid login"), { code: "EAUTH" });
    sendMailMock.mockRejectedValueOnce(eauth);
    const { sendMail, tomarFalloDeEnvio } = await import("../mailer");

    await expect(
      sendMail({ to: "a@test.local", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow();

    const detalle = tomarFalloDeEnvio("a@test.local");
    expect(detalle).toMatch(/credenciales/i);
    expect(detalle).toMatch(/SMTP_PASS/);
  });

  it("traduce los errores de conexión", async () => {
    const timeout = Object.assign(new Error("timeout"), { code: "ETIMEDOUT" });
    sendMailMock.mockRejectedValueOnce(timeout);
    const { sendMail, tomarFalloDeEnvio } = await import("../mailer");

    await expect(
      sendMail({ to: "a@test.local", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow();

    expect(tomarFalloDeEnvio("a@test.local")).toMatch(/conectar/i);
  });
});
