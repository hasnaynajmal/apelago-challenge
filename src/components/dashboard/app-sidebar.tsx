"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarClock, Check, Info, LayoutDashboard, Landmark, Loader2, Plus, Rows3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { INVESTOR_FRAMING, LENSES, resolveLens } from "@/lib/lens";
import { cn } from "@/lib/utils";
import { useLensTransition } from "@/components/dashboard/lens-transition";

export function AppSidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const lens = resolveLens(params.get("lens") ?? undefined);
  const withLens = (href: string) => `${href}?lens=${lens}`;
  const { setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false); // on phones the sidebar is a sheet: close it after navigating

  const NAV = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/ventures", label: "Ventures", icon: Rows3, also: "/dashboard/startups" },
    { href: "/dashboard/deadlines", label: "Deadlines", icon: CalendarClock },
    { href: "/dashboard/investors", label: INVESTOR_FRAMING[lens].ownerId ? "Co-investors" : "Investors", icon: Landmark },
    { href: "/dashboard/guide", label: "Guide", icon: BookOpen },
  ];
  const active = (n: (typeof NAV)[number]) =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href) || (!!n.also && pathname.startsWith(n.also));

  const { switchLens, pending, target } = useLensTransition();
  const selected = pending && target ? target : lens; // move the radio immediately, data follows
  const setLens = (id: string) => {
    switchLens(id, pathname, params.toString());
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-3 py-3.5">
        <Link href={withLens("/dashboard")} onClick={close} className="flex items-center gap-2 overflow-hidden px-1">
          <Image src="/brand/apelago-logo-navy.svg" alt="A'Pelago" width={88} height={14} className="shrink-0 group-data-[collapsible=icon]:hidden" priority />
          <span className="truncate text-sm font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">Atlas</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Assess a startup" className="h-8 bg-navy text-[13px] font-medium text-white hover:bg-navy/90 hover:text-white active:bg-navy active:text-white">
                  <Link href={withLens("/dashboard/assess")} onClick={close}>
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
                  <SidebarMenuButton asChild isActive={active(n)} tooltip={n.label} className="h-8 text-[13px] text-zinc-600 data-[active=true]:font-medium data-[active=true]:text-foreground [&>svg]:size-[15px]">
                    <Link href={withLens(n.href)} onClick={close}>
                      <n.icon /> <span>{n.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="gap-1.5">
            Evaluate for
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="What does this mean?" className="text-muted-foreground hover:text-foreground">
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-60 text-sm">
                Whose criteria the ventures are scored against: Redstone&apos;s fund thesis, A&apos;Pelago&apos;s programme criteria, or a custom thesis.
              </TooltipContent>
            </Tooltip>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-0.5">
              {LENSES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { setLens(l.id); close(); }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                    selected === l.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
                  )}
                >
                  <span className={cn("flex size-3.5 shrink-0 items-center justify-center rounded-full border", selected === l.id ? "border-navy bg-navy text-white" : "border-zinc-300")}>
                    {selected === l.id && (pending ? <Loader2 className="size-2.5 animate-spin" /> : <Check className="size-2" />)}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block truncate text-[13px]", selected === l.id ? "font-medium text-foreground" : "text-zinc-600")}>{l.label}</span>
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
            <SidebarMenuButton asChild tooltip="Back to site" className="h-8 text-[13px] text-zinc-600 [&>svg]:size-[15px]">
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
