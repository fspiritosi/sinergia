import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { env } from "@/lib/env";
import { apiLogger } from "@/lib/logger";
import { userRepository } from "@/repositories/user.repository";
import { roleRepository } from "@/repositories/role.repository";

type ClerkEmailAddress = { id: string; email_address: string };

type ClerkUserEvent = {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  public_metadata: Record<string, unknown> | null;
};

type ClerkWebhookEvent =
  | { type: "user.created"; data: ClerkUserEvent }
  | { type: "user.updated"; data: ClerkUserEvent }
  | { type: "user.deleted"; data: { id: string; deleted?: boolean } }
  | { type: string; data: unknown };

const DEFAULT_ROLE_NAME = "lectura";

function pickEmail(user: ClerkUserEvent): string | null {
  if (!user.email_addresses?.length) return null;
  const primary = user.email_addresses.find((e) => e.id === user.primary_email_address_id);
  return (primary ?? user.email_addresses[0]).email_address;
}

function buildName(user: ClerkUserEvent): string | null {
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

async function resolveRoleIdFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): Promise<string> {
  const requested = typeof metadata?.role === "string" ? (metadata.role as string) : null;

  if (requested) {
    const role = await roleRepository.findByName(requested);
    if (role) return role.id;
    apiLogger.warn({ requested }, "Rol solicitado no existe en DB, usando rol por defecto");
  }

  const defaultRole = await roleRepository.findByName(DEFAULT_ROLE_NAME);
  if (!defaultRole) {
    throw new Error(`Rol por defecto "${DEFAULT_ROLE_NAME}" no encontrado. Correr seed-rbac.`);
  }
  return defaultRole.id;
}

export async function POST(req: NextRequest) {
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
  let event: ClerkWebhookEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (error) {
    apiLogger.warn({ error }, "Clerk webhook: firma inválida");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const data = event.data as ClerkUserEvent;

        apiLogger.info(
          {
            clerkId: data.id,
            type: event.type,
            metadataRole: data.public_metadata?.role,
            hasEmails: data.email_addresses?.length ?? 0,
          },
          "Clerk webhook: payload recibido"
        );

        const email = pickEmail(data);
        if (!email) {
          apiLogger.warn({ clerkId: data.id }, "Clerk webhook: usuario sin email, se omite");
          return NextResponse.json({ ok: true });
        }

        const requestedRoleName =
          typeof data.public_metadata?.role === "string"
            ? (data.public_metadata.role as string)
            : null;

        const roleId = await resolveRoleIdFromMetadata(data.public_metadata);
        const existing = await userRepository.findByClerkId(data.id);

        if (existing) {
          const roleChanged =
            requestedRoleName !== null && existing.role.name !== requestedRoleName;

          await userRepository.update(existing.id, {
            email,
            name: buildName(data),
            ...(roleChanged ? { roleId } : {}),
          });

          apiLogger.info(
            {
              clerkId: data.id,
              previousRole: existing.role.name,
              requestedRole: requestedRoleName,
              roleChanged,
            },
            "Clerk webhook: user actualizado"
          );
        } else {
          const created = await userRepository.upsertFromClerk({
            clerkId: data.id,
            email,
            name: buildName(data),
            roleId,
          });

          apiLogger.info(
            { clerkId: data.id, roleId: created.roleId },
            "Clerk webhook: user creado"
          );
        }

        break;
      }

      case "user.deleted": {
        const data = event.data as { id: string };
        try {
          await userRepository.deactivateByClerkId(data.id);
          apiLogger.info({ clerkId: data.id }, "Clerk webhook: user desactivado");
        } catch {
          apiLogger.warn({ clerkId: data.id }, "Clerk webhook: user.deleted sin registro en DB");
        }
        break;
      }

      default:
        apiLogger.debug({ type: event.type }, "Clerk webhook: evento ignorado");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    apiLogger.error({ error, type: event.type }, "Error procesando webhook");
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 });
  }
}
