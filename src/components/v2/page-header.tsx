"use client";

// Page header (title + subtitle on the left, search / deadlines / Ask Atlas on the right) and the venture search
// palette (Ctrl/⌘ K). Data for search and the bell is read in the browser (public read via RLS), so the header
// never blocks the page.
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Bell, MessageSquareText, Search } from "lucide-react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Flag } from "@/components/country";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCopilotDrawer } from "@/components/copilot/radar-copilot";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function PageHeader({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground">{title}</h1>
        {sub && <p className="mt-1 text-[14px] text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {children}
        <PageActions />
      </div>
    </header>
  );
}

/** Search, deadlines bell and Ask Atlas. Use on pages without a PageHeader (e.g. the venture page). */
export function PageActions() {
  return (
    <Suspense fallback={null}>
      <HeaderActions />
    </Suspense>
  );
}

type Call = { id: string; name: string; deadline_date: string; amount_max_eur: number | null; days: number };
const eur = (n: number | null) => (n == null ? null : n >= 1_000_000 ? `€${+(n / 1_000_000).toFixed(1)}M` : `€${Math.round(n / 1000)}k`);

function HeaderActions() {
  const lens = useSearchParams().get("lens") ?? "redstone-blue";
  const { setOpen } = useCopilotDrawer();
  const [searchOpen, setSearchOpen] = useState(false);
  const [calls, setCalls] = useState<Call[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Calls closing in the next 60 days feed the bell; the badge counts the ones within 30 days.
  useEffect(() => {
    const today = new Date();
    const in60 = new Date(today.getTime() + 60 * 86_400_000);
    supabaseBrowser()
      .from("funding")
      .select("id,name,deadline_date,amount_max_eur")
      .gte("deadline_date", today.toISOString().slice(0, 10))
      .lte("deadline_date", in60.toISOString().slice(0, 10))
      .order("deadline_date")
      .then(({ data }) => {
        const now = Date.now();
        setCalls(((data ?? []) as Omit<Call, "days">[]).map((c) => ({ ...c, days: Math.ceil((new Date(c.deadline_date).getTime() - now) / 86_400_000) })));
      });
  }, []);
  const soon = calls?.filter((c) => c.days <= 30).length ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="hidden h-10 w-64 items-center gap-2 rounded-xl border bg-white px-3 text-[13px] text-muted-foreground shadow-[0_1px_2px_rgb(16_24_40/0.03)] transition-colors hover:border-zinc-300 lg:flex"
      >
        <Search className="size-4" />
        Search ventures…
        <kbd className="ml-auto rounded border bg-zinc-50 px-1.5 font-sans text-[11px]">Ctrl K</kbd>
      </button>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label="Search ventures"
        className="flex size-10 items-center justify-center rounded-xl border bg-white text-zinc-600 hover:bg-zinc-50 lg:hidden"
      >
        <Search className="size-4" />
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Upcoming deadlines"
            className="relative flex size-10 items-center justify-center rounded-xl border bg-white text-zinc-600 transition-colors hover:bg-zinc-50 data-[state=open]:bg-zinc-50"
          >
            <Bell className="size-4" />
            {!!soon && (
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white ring-2 ring-white">
                {soon}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-80 rounded-xl p-0">
          <div className="border-b px-4 py-3">
            <div className="text-[13px] font-semibold">Upcoming deadlines</div>
            <div className="text-xs text-muted-foreground">Funding calls closing in the next 60 days</div>
          </div>
          <ul className="max-h-72 divide-y overflow-y-auto">
            {calls === null && <li className="px-4 py-4 text-xs text-muted-foreground">Loading…</li>}
            {calls?.length === 0 && <li className="px-4 py-4 text-xs text-muted-foreground">Nothing closes in the next 60 days.</li>}
            {calls?.map((c) => {
              const d = c.days;
              return (
                <li key={c.id}>
                  <Link href={`/dashboard/deadlines?lens=${lens}`} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-50">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", d <= 30 ? "bg-amber-500" : "bg-sky-500")} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-[13px] font-medium leading-snug">{c.name}</span>
                      <span className={cn("block text-xs", d <= 30 ? "text-amber-700" : "text-muted-foreground")}>
                        {d} days left · {new Date(c.deadline_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        {c.amount_max_eur ? ` · up to ${eur(c.amount_max_eur)}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href={`/dashboard/deadlines?lens=${lens}`} className="flex items-center justify-center gap-1 border-t px-4 py-2.5 text-[13px] font-medium text-navy hover:bg-zinc-50">
            View all deadlines <ArrowRight className="size-3.5" />
          </Link>
        </PopoverContent>
      </Popover>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-navy/90"
      >
        <MessageSquareText className="size-4" />
        <span className="hidden sm:inline">Ask Atlas</span>
      </button>
      <VentureSearch open={searchOpen} onOpenChange={setSearchOpen} lens={lens} />
    </>
  );
}

type Item = { id: string; name: string; country: string | null; one_liner: string | null };

function VentureSearch({ open, onOpenChange, lens }: { open: boolean; onOpenChange: (v: boolean) => void; lens: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    if (!open || items) return;
    supabaseBrowser()
      .from("startups")
      .select("id,name,country,one_liner")
      .order("name")
      .then(({ data }) => setItems((data ?? []) as Item[]));
  }, [open, items]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search ventures" description="Jump to a venture">
      {/* This shadcn version expects the Command root inside the dialog. */}
      <Command>
      <CommandInput placeholder="Search ventures by name…" />
      <CommandList>
        <CommandEmpty>{items ? "No venture found." : "Loading…"}</CommandEmpty>
        <CommandGroup heading="Ventures">
          {(items ?? []).map((v) => (
            <CommandItem
              key={v.id}
              value={`${v.name} ${v.one_liner ?? ""}`}
              onSelect={() => {
                onOpenChange(false);
                router.push(`/dashboard/startups/${v.id}?lens=${lens}`);
              }}
              className="gap-2.5"
            >
              <Flag code={v.country} />
              <span className="font-medium">{v.name}</span>
              {v.one_liner && <span className={cn("truncate text-xs text-muted-foreground")}>{v.one_liner}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
