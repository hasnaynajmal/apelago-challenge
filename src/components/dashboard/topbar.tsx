"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Dashboard";
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur-md lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <span className="h-4 w-px bg-border" />
      <span className="text-[15px] font-medium">{title}</span>
      <span className="ml-auto rounded-full border bg-white px-3 py-1 text-[13px] text-muted-foreground">
        Evaluating for <span className="font-medium text-foreground">{lens.label}</span>
      </span>
    </header>
  );
}
