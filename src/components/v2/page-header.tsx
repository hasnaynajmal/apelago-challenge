"use client";

// Page header (title + subtitle on the left, search / deadlines / Ask Atlas on the right) and the venture search
// palette (Ctrl/⌘ K). Data for search and the bell is read in the browser (public read via RLS), so the header
// never blocks the page.
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquareText, Search } from "lucide-react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Flag } from "@/components/country";
import { NotificationsBell } from "@/components/v2/notifications";
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


function HeaderActions() {
  const lens = useSearchParams().get("lens") ?? "redstone-blue";
  const { setOpen } = useCopilotDrawer();
  const [searchOpen, setSearchOpen] = useState(false);

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
      <NotificationsBell lens={lens} />
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
