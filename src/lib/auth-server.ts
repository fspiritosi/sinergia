import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mailer";
import { authLogger } from "@/lib/logger";
import { ROLES } from "@/lib/rbac/permissions";
import { roleRepository } from "@/repositories/role.repository";

/**
 * Rol asignado a quien se registra por su cuenta en /sign-up.
 * Replica el comportamiento que tenía el bootstrap on-demand de Clerk.
 */
export const DEFAULT_ROLE_NAME = ROLES.LECTURA;

const BCRYPT_ROUNDS = 10;

function layout(title: string, body: string) {
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
      <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
      ${body}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0" />
      <p style="font-size:12px;color:#666;margin:0">
        Si no esperabas este correo podés ignorarlo.
      </p>
    </div>`;
}

function actionButton(url: string, label: string) {
  return `
    <p style="margin:0 0 16px">
      <a href="${url}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">
        ${label}
      </a>
    </p>
    <p style="font-size:13px;color:#555;margin:0">
      Si el botón no funciona, copiá y pegá este enlace:<br />
      <span style="word-break:break-all">${url}</span>
    </p>`;
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,

    // Paridad con Clerk: hoy el auto-registro en /sign-up exige verificación
    // por código de email (verificado en la API de Clerk: los usuarios
    // auto-registrados tienen strategy=email_code). No bajar esto a false.
    requireEmailVerification: true,

    // bcrypt en lugar del scrypt por defecto de better-auth. Es lo que permite
    // reusar tal cual los password_digest exportados de Clerk, que son bcrypt.
    // Las contraseñas nuevas se hashean con el mismo algoritmo, así que no
    // queda lógica híbrida ni hashes de dos formatos conviviendo.
    password: {
      hash: async (password) => bcrypt.hash(password, BCRYPT_ROUNDS),
      verify: async ({ hash, password }) => bcrypt.compare(password, hash),
    },

    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Restablecé tu contraseña — Sinergia Ambiental",
        html: layout(
          "Restablecé tu contraseña",
          `<p style="margin:0 0 16px">Hola${user.name ? ` ${user.name}` : ""}, recibimos un pedido para cambiar tu contraseña.</p>
           ${actionButton(url, "Definir nueva contraseña")}`
        ),
      });
    },
  },

  emailVerification: {
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Verificá tu email — Sinergia Ambiental",
        html: layout(
          "Verificá tu email",
          `<p style="margin:0 0 16px">Hola${user.name ? ` ${user.name}` : ""}, confirmá tu dirección para activar tu cuenta.</p>
           ${actionButton(url, "Verificar email")}`
        ),
      });
    },
  },

  user: {
    additionalFields: {
      // El RBAC del proyecto vive en Role/Permission/RolePermission. better-auth
      // no lo conoce: sólo necesita poder escribir roleId al crear el usuario.
      // input:false evita que un cliente pueda mandarse un rol en el signup.
      //
      // required:false es a propósito, aunque la columna sea NOT NULL: con
      // required:true, better-auth rechaza el alta por "roleId is required"
      // ANTES de correr el hook de abajo, que es justamente quien lo completa.
      // Si el hook fallara, el NOT NULL de Postgres sigue siendo la red final.
      roleId: { type: "string", required: false, input: false },
      isActive: { type: "boolean", defaultValue: true, required: false, input: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Reemplaza a resolveRoleIdForBootstrap() del flujo de Clerk.
          // User.roleId es una FK obligatoria, así que hay que resolverla acá:
          // si el alta no trajo rol (auto-registro en /sign-up), cae al default.
          const data = user as typeof user & { roleId?: string | null };
          if (data.roleId) return { data };

          const fallback = await roleRepository.findByName(DEFAULT_ROLE_NAME);
          if (!fallback) {
            throw new Error(
              `Rol por defecto "${DEFAULT_ROLE_NAME}" no encontrado. Correr prisma/seed-rbac.ts`
            );
          }

          authLogger.info(
            { email: user.email },
            "Alta sin rol explícito: asignando rol por defecto"
          );
          return { data: { ...data, roleId: fallback.id } };
        },
      },
    },
  },

  // Sin plugin admin() a propósito: inyecta al modelo user los campos
  // role/banned/banReason/banExpires. Un campo `role` conviviendo con nuestro
  // roleId dejaría dos fuentes de verdad para el rol —justo lo que esta
  // migración elimina— y ban/impersonation son features que hoy no existen.
});
