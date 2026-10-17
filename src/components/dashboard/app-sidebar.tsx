"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarClock, Check, LayoutDashboard, Landmark, Plus, Rows3 } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar";
import { INVESTOR_FRAMING, LENSES, resolveLens } from "@/lib/lens";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const lens = resolveLens(params.get("lens") ?? undefined);
  const withLens = (href: string) => `${href}?lens=${lens}`;

  const NAV = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/ventures", label: "Ventures", icon: Rows3, also: "/dashboard/startups" },
    { href: "/dashboard/deadlines", label: "Deadlines", icon: CalendarClock },
    { href: "/dashboard/investors", label: INVESTOR_FRAMING[lens].ownerId ? "Co-investors" : "Investors", icon: Landmark },
  ];
  const active = (n: (typeof NAV)[number]) =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href) || (!!n.also && pathname.startsWith(n.also));

  const setLens = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("lens", id);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-3 py-4">
        <Link href={withLens("/dashboard")} className="flex items-center gap-2 overflow-hidden px-1">
          <Image src="/brand/apelago-logo-navy.svg" alt="A'Pelago" width={96} height={15} className="shrink-0 group-data-[collapsible=icon]:hidden" priority />
          <span className="truncate text-sm font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">Radar</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Assess a startup" className="h-10 bg-navy font-medium text-white hover:bg-navy/90 hover:text-white active:bg-navy active:text-white">
                  <Link href={withLens("/dashboard/assess")}>
                    <Plus /> <span>Assess a startup</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((n) => (
                <SidebarMenuItem key={n.href}>
                  <SidebarMenuButton asChild isActive={active(n)} tooltip={n.label} className="h-10 text-[15px]">
                    <Link href={withLens(n.href)}>
                      <n.icon /> <span>{n.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Viewing as</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-1">
              {LENSES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLens(l.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors",
                    lens === l.id ? "border-navy/30 bg-navy-soft" : "border-transparent hover:bg-sidebar-accent",
                  )}
                >
                  <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border", lens === l.id ? "border-navy bg-navy text-white" : "border-zinc-300")}>
                    {lens === l.id && <Check className="size-2.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{l.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{l.kind}</span>
                  </span>
                </button>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to site">
              <Link href="/">
                <ArrowLeft /> <span>Back to site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
