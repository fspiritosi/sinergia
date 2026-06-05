"use client";

import * as React from "react";
import { HelpCircle, Minus, Plus } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/components/rbac/use-permissions";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { useUnreadSupportTicketsCount } from "@/features/Ayuda/hooks/useUnreadSupportTicketsCount";

type NavItem = {
  title: string;
  url: string;
  requiredPermission?: string;
};

type NavSection = {
  title: string;
  url: string;
  items: NavItem[];
};

const navMain: NavSection[] = [
  {
    title: "Gestión",
    url: "/dashboard/clientes",
    items: [
      {
        title: "Clientes",
        url: "/dashboard/clientes",
        requiredPermission: PERMISSIONS.CLIENTES_VIEW,
      },
      {
        title: "Propuestas",
        url: "/dashboard/clientes/propuestas",
        requiredPermission: PERMISSIONS.PROPUESTAS_VIEW,
      },
    ],
  },
  {
    title: "Planificación",
    url: "/dashboard/planes",
    items: [
      {
        title: "Calendario",
        url: "/dashboard/planificacion",
        requiredPermission: PERMISSIONS.PLANIFICACION_VIEW,
      },
      {
        title: "Planes de Trabajo",
        url: "/dashboard/planes",
        requiredPermission: PERMISSIONS.PLANES_VIEW,
      },
      {
        title: "Informes",
        url: "/dashboard/informes",
        requiredPermission: PERMISSIONS.INFORMES_VIEW,
      },
      {
        title: "Inspecciones",
        url: "/dashboard/inspecciones",
        requiredPermission: PERMISSIONS.INSPECCIONES_VIEW,
      },
    ],
  },
  {
    title: "Configuración",
    url: "/dashboard/configuracion",
    items: [
      {
        title: "Servicios",
        url: "/dashboard/servicios",
        requiredPermission: PERMISSIONS.SERVICIOS_VIEW,
      },
      {
        title: "Items",
        url: "/dashboard/items",
        requiredPermission: PERMISSIONS.ITEMS_VIEW,
      },
      {
        title: "Tipos de Informe",
        url: "/dashboard/tipos-informe",
        requiredPermission: PERMISSIONS.TIPOS_INFORME_VIEW,
      },
      {
        title: "Tipos de Variantes",
        url: "/dashboard/tipos-variante",
        requiredPermission: PERMISSIONS.TIPOS_VARIANTE_VIEW,
      },
      {
        title: "Detalle de Variantes",
        url: "/dashboard/detalles-variante",
        requiredPermission: PERMISSIONS.DETALLES_VARIANTE_VIEW,
      },
      {
        title: "Condiciones",
        url: "/dashboard/condiciones",
        requiredPermission: PERMISSIONS.CONDICIONES_VIEW,
      },
      {
        title: "Usuarios",
        url: "/dashboard/usuarios",
        requiredPermission: PERMISSIONS.USUARIOS_VIEW,
      },
      {
        title: "Roles y permisos",
        url: "/dashboard/roles",
        requiredPermission: PERMISSIONS.USUARIOS_MANAGE_ROLES,
      },
    ],
  },
];

function AyudaNavItem({ pathname }: { pathname: string | null }) {
  const unreadCount = useUnreadSupportTicketsCount();
  const isActive = pathname === "/dashboard/help" || pathname?.startsWith("/dashboard/help/");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href="/dashboard/help">
          <HelpCircle />
          <span>Ayuda</span>
        </Link>
      </SidebarMenuButton>
      {unreadCount > 0 && <SidebarMenuBadge>{unreadCount}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user } = useUser();
  const { can } = usePermissions();

  const visibleSections = navMain
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.requiredPermission || can(item.requiredPermission)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center justify-center">
          <Image
            src="/LogoHorizontal.webp"
            alt="Sinergia Logo"
            width={200}
            height={64}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {visibleSections.map((item, index) => {
              const isSectionActive = item.items.some((child) => {
                if (!pathname) return false;
                return pathname === child.url || pathname.startsWith(`${child.url}/`);
              });

              return (
                <Collapsible
                  key={item.title}
                  defaultOpen={isSectionActive || index === 0}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {item.title}{" "}
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((child) => {
                          const isActive = pathname === child.url;

                          return (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton asChild isActive={isActive}>
                                <Link href={child.url}>{child.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
            <AyudaNavItem pathname={pathname} />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SignedIn>
          <div className="w-full px-4 py-2 ring-1 ring-sidebar-primary-foreground flex items-center justify-around gap-2">
            <UserButton />
            <div>
              <p className="text-xs font-semibold">{user?.fullName}</p>
              <span className="text-xs text-gray-400">
                {user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress}
              </span>
            </div>
          </div>
        </SignedIn>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
