"use client";

// v2: on desktop every page renders its own header (PageHeader); this slim bar only exists on phones,
// where the sidebar is a sheet and needs a trigger.
import Image from "next/image";
import { MessageSquareText } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCopilotDrawer } from "@/components/copilot/radar-copilot";

export function DashboardTopbar() {
  const { setOpen } = useCopilotDrawer();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur-md md:hidden">
      <SidebarTrigger className="-ml-1" />
      <Image src="/brand/apelago-logo-navy.svg" alt="A'Pelago" width={84} height={13} />
      <span className="text-sm font-medium text-muted-foreground">Atlas</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask Atlas"
        className="ml-auto flex size-9 items-center justify-center rounded-xl bg-navy text-white"
      >
        <MessageSquareText className="size-4" />
      </button>
    </header>
  );
}
