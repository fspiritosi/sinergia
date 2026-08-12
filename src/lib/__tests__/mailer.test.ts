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
});
