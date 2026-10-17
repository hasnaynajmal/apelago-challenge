"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeft, BookOpen, CalendarClock, Check, ChevronsUpDown, LayoutDashboard, Landmark, Loader2, MessageSquareText, Plus, Rows3,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { useCopilotDrawer } from "@/components/copilot/radar-copilot";
import { useLensTransition } from "@/components/dashboard/lens-transition";
import { INVESTOR_FRAMING, LENSES, resolveLens } from "@/lib/lens";
import { cn } from "@/lib/utils";

const LENS_TILE: Record<string, { initials: string; cls: string }> = {
  "redstone-blue": { initials: "RB", cls: "bg-navy text-white" },
  "apelago-accelerator": { initials: "AP", cls: "bg-gold text-navy" },
  "nordic-climate-generalist": { initials: "CT", cls: "bg-violet-600 text-white" },
};

const ITEM = "h-9 rounded-lg px-2.5 text-[13.5px] text-zinc-600 hover:bg-zinc-50 hover:text-foreground data-[active=true]:bg-navy-soft data-[active=true]:font-medium data-[active=true]:text-navy [&>svg]:size-[16px]";

export function AppSidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const lens = resolveLens(params.get("lens") ?? undefined);
  const withLens = (href: string) => `${href}?lens=${lens}`;
  const { setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false); // on phones the sidebar is a sheet: close it after navigating
  const { setOpen: openAtlas } = useCopilotDrawer();

  const WORKSPACE = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/ventures", label: "Ventures", icon: Rows3, also: "/dashboard/startups" },
    { href: "/dashboard/deadlines", label: "Deadlines", icon: CalendarClock },
    { href: "/dashboard/investors", label: INVESTOR_FRAMING[lens].ownerId ? "Co-investors" : "Investors", icon: Landmark },
  ];
  const active = (n: { href: string; exact?: boolean; also?: string }) =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href) || (!!n.also && pathname.startsWith(n.also));

  return (
    <Sidebar collapsible="icon" className="border-r-0 [&_[data-slot=sidebar-inner]]:border-r">
      <SidebarHeader className="gap-4 px-3 pb-2 pt-5">
        <Link href={withLens("/dashboard")} onClick={close} className="flex items-center gap-2 overflow-hidden px-1.5">
          <Image src="/brand/apelago-logo-navy.svg" alt="A'Pelago" width={96} height={15} className="shrink-0 group-data-[collapsible=icon]:hidden" priority />
          <span className="truncate text-[15px] font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">Atlas</span>
        </Link>
        <ThesisSwitcher lens={lens} pathname={pathname} search={params.toString()} onPicked={close} />
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Assess a startup" className="h-9 justify-center rounded-lg bg-navy text-[13.5px] font-medium text-white hover:bg-navy/90 hover:text-white active:bg-navy active:text-white">
                  <Link href={withLens("/dashboard/assess")} onClick={close}>
                    <Plus /> <span>Assess a startup</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {WORKSPACE.map((n) => (
                <SidebarMenuItem key={n.href}>
                  <SidebarMenuButton asChild isActive={active(n)} tooltip={n.label} className={ITEM}>
                    <Link href={withLens(n.href)} onClick={close}>
                      <n.icon /> <span>{n.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Help</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Ask Atlas" className={ITEM} onClick={() => { close(); openAtlas(true); }}>
                  <MessageSquareText /> <span>Ask Atlas</span>
                  <kbd className="ml-auto rounded border bg-white px-1 font-sans text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">Ctrl J</kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/guide")} tooltip="Guide" className={ITEM}>
                  <Link href={withLens("/dashboard/guide")} onClick={close}>
                    <BookOpen /> <span>Guide</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        <div className="rounded-xl border bg-zinc-50/70 p-3 text-xs leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
          <span className="font-medium text-foreground">Deep Panel</span> researches and scores any ocean startup in about a minute.
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to site" className={ITEM}>
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

/** Card at the top of the sidebar showing whose thesis the app evaluates for; opens a picker. */
function ThesisSwitcher({ lens, pathname, search, onPicked }: { lens: string; pathname: string; search: string; onPicked: () => void }) {
  const [open, setOpen] = useState(false);
  const { switchLens, pending, target } = useLensTransition();
  const selected = pending && target ? target : lens; // reflect the choice immediately; data follows
  const current = LENSES.find((l) => l.id === selected)!;
  const tile = LENS_TILE[current.id];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-xl border bg-white p-2 text-left shadow-[0_1px_2px_rgb(16_24_40/0.04)] transition-colors hover:border-zinc-300 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none"
        >
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold group-data-[collapsible=icon]:size-8", tile.cls)}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : tile.initials}
          </span>
          <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="block text-[11px] text-muted-foreground">Evaluating for</span>
            <span className="block truncate text-[13.5px] font-semibold text-foreground">{current.label}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-zinc-400 group-data-[collapsible=icon]:hidden" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[--radix-popover-trigger-width] min-w-64 rounded-xl p-1.5">
        <div className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Evaluate for</div>
        {LENSES.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => {
              setOpen(false);
              onPicked();
              switchLens(l.id, pathname, search);
            }}
            className={cn("flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-50", selected === l.id && "bg-zinc-50")}
          >
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold", LENS_TILE[l.id].cls)}>{LENS_TILE[l.id].initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{l.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{l.kind}</span>
            </span>
            {selected === l.id && <Check className="size-4 text-navy" />}
          </button>
        ))}
        <p className="mt-1 border-t px-2 pb-1 pt-2 text-xs leading-relaxed text-muted-foreground">
          Whose criteria the ventures are scored against. Switching updates scores, groups, rankings and matches.
        </p>
      </PopoverContent>
    </Popover>
  );
}
