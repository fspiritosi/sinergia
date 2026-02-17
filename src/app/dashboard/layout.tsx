import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardTitleProvider } from "@/components/dashboard/DashboardTitleContext";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function Page({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <DashboardTitleProvider>
        <AppSidebar />
        <SidebarInset className="overflow-x-hidden">
          <PageHeader />
          <div className="flex-1 overflow-x-auto p-8">{children}</div>
        </SidebarInset>
      </DashboardTitleProvider>
    </SidebarProvider>
  );
}
