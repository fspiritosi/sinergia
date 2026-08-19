import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardTitleProvider } from "@/components/dashboard/DashboardTitleContext";
import { PermissionsProvider } from "@/components/rbac/PermissionsProvider";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUserPermissions } from "@/lib/auth";
import { isRoleAllowedForRoute } from "@/lib/rbac/authorize-route";
import { PATHNAME_HEADER } from "@/proxy";
import { authLogger } from "@/lib/logger";
import { SupportTicketsRealtimeProvider } from "@/features/Ayuda/components/SupportTicketsRealtimeProvider";

export default async function Page({ children }: { children: React.ReactNode }) {
  const { role, codes } = await getCurrentUserPermissions();

  // Sin rol no hay usuario válido en la DB: el middleware ya exigió cookie de
  // sesión, así que llegar acá sin rol significa sesión huérfana o usuario
  // borrado.
  if (!role) {
    redirect("/sign-in");
  }

  // Autorización por rol de ruta. Antes vivía en el middleware leyendo el
  // session token de Clerk; ahora se resuelve acá, donde ya tenemos el rol
  // desde la DB y no hace falta duplicar la consulta.
  const pathname = (await headers()).get(PATHNAME_HEADER) ?? "";

  if (!pathname) {
    // No debería pasar: el matcher del proxy cubre todo /dashboard/*. Si pasa,
    // es un bug de configuración y hay que verlo — pero la autorización fina
    // sigue cubierta por requirePermission() en cada server action.
    authLogger.error({ role }, "Guard de ruta sin pathname: revisar el matcher de proxy.ts");
  } else if (!isRoleAllowedForRoute(pathname, role)) {
    redirect("/dashboard?forbidden=1");
  }

  return (
    <PermissionsProvider role={role} codes={codes}>
      <SupportTicketsRealtimeProvider>
        <SidebarProvider>
          <DashboardTitleProvider>
            <AppSidebar />
            <SidebarInset className="overflow-x-hidden">
              <PageHeader />
              <div className="flex-1 overflow-x-auto p-8">{children}</div>
            </SidebarInset>
          </DashboardTitleProvider>
        </SidebarProvider>
      </SupportTicketsRealtimeProvider>
    </PermissionsProvider>
  );
}
