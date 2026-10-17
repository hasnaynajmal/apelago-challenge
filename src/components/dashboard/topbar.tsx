"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Loader2, MessageSquareText } from "lucide-react";
import { LensProgressBar, useLensTransition } from "@/components/dashboard/lens-transition";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCopilotDrawer } from "@/components/copilot/radar-copilot";
import { LENSES, resolveLens } from "@/lib/lens";
import { cn } from "@/lib/utils";

const TITLES: [string, string][] = [
  ["/dashboard/ventures", "Ventures"],
  ["/dashboard/startups", "Venture"],
  ["/dashboard/deadlines", "Deadlines"],
  ["/dashboard/investors", "Investors"],
  ["/dashboard/assess", "Assess a startup"],
  ["/dashboard/runs", "Live assessment"],
  ["/dashboard/guide", "Guide"],
  ["/dashboard", "Overview"],
];

export function DashboardTopbar() {
  const pathname = usePathname();
  const params = useSearchParams(); // hooks must run unconditionally, never inside callbacks
  const lensId = resolveLens(params.get("lens") ?? undefined);
  const { open, setOpen } = useCopilotDrawer();
  const { pending, target } = useLensTransition();
  const shown = LENSES.find((l) => l.id === (pending && target ? target : lensId))!;
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Dashboard";
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur-md lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <span className="h-4 w-px bg-border" />
      <span className="text-[15px] font-medium">{title}</span>
      <span className={cn("ml-auto hidden items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-[13px] text-muted-foreground transition-colors sm:inline-flex", pending && "border-navy/30 bg-navy-soft")}>
        {pending && <Loader2 className="size-3 animate-spin text-navy" />}
        {pending ? "Switching to" : "Evaluating for"} <span className="font-medium text-foreground">{shown.label}</span>
      </span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ml-auto inline-flex h-8 items-center gap-2 rounded-full border bg-white px-3 text-[13px] font-medium text-foreground transition-colors hover:border-zinc-300 hover:bg-zinc-50 sm:ml-0"
      >
        <MessageSquareText className="size-3.5 text-navy" />
        Ask Atlas
        <kbd className="hidden rounded border bg-zinc-50 px-1 font-sans text-[11px] text-muted-foreground md:inline">Ctrl J</kbd>
      </button>
      <LensProgressBar />
    </header>
  );
}
