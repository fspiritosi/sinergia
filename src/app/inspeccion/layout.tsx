import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUserPermissions } from "@/lib/auth";
import { PermissionsProvider } from "@/components/rbac/PermissionsProvider";
import Image from "next/image";
import Link from "next/link";

export default async function InspeccionLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { role, codes } = await getCurrentUserPermissions();

  return (
    <PermissionsProvider role={role} codes={codes}>
      <div className="min-h-screen bg-background">
        <header className="border-b px-4 py-3 flex items-center justify-between">
          <Link href="/inspeccion">
            <Image
              src="/LogoHorizontal.webp"
              alt="Sinergia"
              width={140}
              height={45}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </header>
        <main className="p-4 max-w-4xl mx-auto">{children}</main>
      </div>
    </PermissionsProvider>
  );
}
