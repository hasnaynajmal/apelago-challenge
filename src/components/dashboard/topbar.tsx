"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCopilotDrawer } from "@/components/copilot/radar-copilot";
import { LENSES, resolveLens } from "@/lib/lens";

const TITLES: [string, string][] = [
  ["/dashboard/ventures", "Ventures"],
  ["/dashboard/startups", "Venture"],
  ["/dashboard/deadlines", "Deadlines"],
  ["/dashboard/investors", "Investors"],
  ["/dashboard/assess", "Assess a startup"],
  ["/dashboard/runs", "Live assessment"],
  ["/dashboard", "Overview"],
];

export function DashboardTopbar() {
  const pathname = usePathname();
  const params = useSearchParams(); // hooks must run unconditionally, never inside callbacks
  const lensId = resolveLens(params.get("lens") ?? undefined);
  const lens = LENSES.find((l) => l.id === lensId)!;
  const { open, setOpen } = useCopilotDrawer();
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Dashboard";
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur-md lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <span className="h-4 w-px bg-border" />
      <span className="text-[15px] font-medium">{title}</span>
      <span className="ml-auto hidden rounded-full sm:inline border bg-white px-3 py-1 text-[13px] text-muted-foreground">
        Evaluating for <span className="font-medium text-foreground">{lens.label}</span>
      </span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-navy px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-navy/90 sm:ml-0"
      >
        <Sparkles className="size-3.5 text-gold" />
        Ask Radar
        <kbd className="ml-1 hidden rounded bg-white/15 px-1 font-sans text-[11px] text-white/80 md:inline">Ctrl J</kbd>
      </button>
    </header>
  );
}
