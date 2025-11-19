import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function Page({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader />
        <div className="h-full w-full p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
