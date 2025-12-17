"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SignedIn, UserButton, useUser } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Gestión",
      url: "/dashboard/clientes",
      items: [
        {
          title: "Clientes",
          url: "/dashboard/clientes",
          isActive: true,
        },
        {
          title: "Propuestas",
          url: "/dashboard/clientes/propuestas",
          isActive: false,
        },
        {
          title: "Servicios",
          url: "/dashboard/servicios",
          isActive: false,
        },
        {
          title: "Items",
          url: "/dashboard/items",
          isActive: false,
        },
        {
          title: "Usuarios",
          url: "/dashboard/usuarios",
          isActive: false,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useUser()
  const isAdmin = user?.publicMetadata?.role === "admin"

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
            {data.navMain.map((item, index) => {
              const isSectionActive = item.items?.some((child) => {
                if (!pathname) return false
                return pathname === child.url || pathname.startsWith(`${child.url}/`)
              })

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
                    {item.items?.length ? (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((child) => {
                            if (child.url === "/dashboard/usuarios" && !isAdmin) {
                              return null
                            }
                            const isActive = pathname === child.url

                            return (
                              <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActive}
                                >
                                  <Link href={child.url}>{child.title}</Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    ) : null}
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}
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
  )
}
