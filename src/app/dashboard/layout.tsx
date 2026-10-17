import { Suspense } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RadarCopilot } from "@/components/copilot/radar-copilot";
import { LensContent, LensTransitionProvider } from "@/components/dashboard/lens-transition";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LensTransitionProvider>
    <RadarCopilot>
      <SidebarProvider>
        <Suspense>
          <AppSidebar />
        </Suspense>
        <SidebarInset className="bg-[#fafafa]">
          <Suspense>
            <DashboardTopbar />
          </Suspense>
          <LensContent className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</LensContent>
        </SidebarInset>
      </SidebarProvider>
    </RadarCopilot>
    </LensTransitionProvider>
  );
}
