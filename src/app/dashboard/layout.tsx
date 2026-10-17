import { Suspense } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RadarCopilot } from "@/components/copilot/radar-copilot";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RadarCopilot>
      <SidebarProvider>
        <Suspense>
          <AppSidebar />
        </Suspense>
        <SidebarInset className="bg-[#fafafa]">
          <Suspense>
            <DashboardTopbar />
          </Suspense>
          <div className="flex-1 px-6 py-8 lg:px-10">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </RadarCopilot>
  );
}
