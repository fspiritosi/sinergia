"use server";

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { authLogger } from "@/lib/logger";

export type AppUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  is_active: boolean;
  createdAt: string; // ISO
};

type CreateUserPayload = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export async function createUserAction(data: CreateUserPayload): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const role = user?.publicMetadata?.role;

  if (role !== "admin") {
    redirect("/dashboard");
  }

  const email = data.email?.trim() ?? "";
  const firstName = data.firstName?.trim() ?? "";
  const lastName = data.lastName?.trim() ?? "";
  const newUserRole = data.role ?? "user";

  if (!email) {
    throw new Error("El email es obligatorio");
  }

  const client = await clerkClient();

  try {
    await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
      publicMetadata: {
        role: newUserRole === "admin" ? "admin" : "user",
      },
    });
  } catch (error: unknown) {
    authLogger.error({ error, email }, "Error al crear usuario en Clerk");

    const anyError = error as any;
    const firstMessage =
      anyError?.errors?.[0]?.message ||
      anyError?.errors?.[0]?.code ||
      anyError?.message ||
      "Error desconocido al crear usuario";

    throw new Error(String(firstMessage));
  }
}

export const getUsers = async (): Promise<AppUser[]> => {
  const client = await clerkClient();
  const users = await client.users.getUserList({ limit: 50 });

  return users.data.map((user) => {
    const primaryEmail =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "";

    return {
      id: user.id,
      email: primaryEmail,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      role: (user.publicMetadata as any)?.role ?? null,
      is_active: !user.banned && !user.locked,
      createdAt: new Date(user.createdAt).toISOString(),
    };
  });
};