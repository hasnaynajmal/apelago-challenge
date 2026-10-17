"use client";

// Notifications bell: a dropdown feed of what needs attention (deadlines closing, levels flagged by the Second
// Opinion, assessments that just finished or failed). Read in the browser via public RLS reads.
// "New" activity is tracked per browser (localStorage); deadlines within 30 days always count as urgent.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, CalendarClock, CheckCircle2, CircleAlert, TriangleAlert } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  kind: "deadline" | "review" | "done" | "failed";
  title: string;
  sub: string;
  href: string;
  at: number; // ms timestamp used for "new" and sorting
  urgent?: boolean;
};

const ICON = {
  deadline: { icon: CalendarClock, cls: "bg-amber-50 text-amber-700" },
  review: { icon: TriangleAlert, cls: "bg-orange-50 text-orange-700" },
  done: { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
  failed: { icon: CircleAlert, cls: "bg-rose-50 text-rose-700" },
} as const;

const SEEN_KEY = "atlas.notifications.seen";
const eur = (n: number | null) => (n == null ? null : n >= 1_000_000 ? `€${+(n / 1_000_000).toFixed(1)}M` : `€${Math.round(n / 1000)}k`);
const ago = (ms: number, now: number) => {
  const m = Math.round((now - ms) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};
const LEVEL = { trl: "TRL", brl: "BRL", oirl: "OIRL", irl: "IRL" } as Record<string, string>;

export function NotificationsBell({ lens }: { lens: string }) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [seen, setSeen] = useState(0);
  const [tab, setTab] = useState<"all" | "deadline" | "activity">("all");

  useEffect(() => {
    const db = supabaseBrowser();
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const in60 = new Date(now + 60 * 86_400_000).toISOString().slice(0, 10);
    const weekAgo = new Date(now - 7 * 86_400_000).toISOString();
    Promise.all([
      db.from("funding").select("id,name,deadline_date,amount_max_eur").gte("deadline_date", today).lte("deadline_date", in60).order("deadline_date"),
      db.from("assessments").select("startup_id,framework,created_at,startups(name)").eq("needs_review", true),
      db.from("pipeline_runs").select("id,startup_id,status,started_at,finished_at,startups(name)").gte("started_at", weekAgo).order("started_at", { ascending: false }).limit(20),
    ]).then(([calls, reviews, runs]) => {
      try {
        setSeen(Number(localStorage.getItem(SEEN_KEY) ?? 0));
      } catch {}
      const out: Note[] = [];
      for (const c of calls.data ?? []) {
        const days = Math.ceil((new Date(c.deadline_date).getTime() - now) / 86_400_000);
        out.push({
          id: `d-${c.id}`, kind: "deadline", urgent: days <= 30, at: new Date(c.deadline_date).getTime(),
          title: `${c.name.split(" – ")[0]} closes in ${days} days`,
          sub: `${new Date(c.deadline_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}${c.amount_max_eur ? ` · up to ${eur(c.amount_max_eur)}` : ""}`,
          href: `/dashboard/deadlines?lens=${lens}`,
        });
      }
      const byStartup = new Map<string, { name: string; levels: string[]; at: number }>();
      type Review = { startup_id: string; framework: string; created_at: string | null; startups: unknown };
      for (const r of (reviews.data ?? []) as Review[]) {
        const name = (r.startups as unknown as { name: string } | null)?.name ?? r.startup_id;
        const e = byStartup.get(r.startup_id) ?? { name, levels: [], at: 0 };
        e.levels.push(LEVEL[r.framework] ?? r.framework);
        e.at = Math.max(e.at, new Date(r.created_at ?? 0).getTime() || 0);
        byStartup.set(r.startup_id, e);
      }
      for (const [id, e] of byStartup) {
        out.push({
          id: `r-${id}`, kind: "review", at: e.at, title: `${e.name} needs a review`,
          sub: `Second Opinion disagrees on ${e.levels.join(", ")}`, href: `/dashboard/startups/${id}?lens=${lens}`,
        });
      }
      const latest = new Set<string>();
      for (const r of runs.data ?? []) {
        if (latest.has(r.startup_id) || r.status === "running") continue;
        latest.add(r.startup_id);
        const name = (r.startups as unknown as { name: string } | null)?.name ?? r.startup_id;
        const at = new Date(r.finished_at ?? r.started_at).getTime();
        out.push(
          r.status === "done"
            ? { id: `run-${r.id}`, kind: "done", at, title: `${name} assessed`, sub: `Deep Panel finished · ${ago(at, now)}`, href: `/dashboard/startups/${r.startup_id}?lens=${lens}` }
            : { id: `run-${r.id}`, kind: "failed", at, title: `Assessment of ${name} failed`, sub: ago(at, now), href: `/dashboard/runs/${r.id}?lens=${lens}` },
        );
      }
      setNotes(out);
    });
  }, [lens]);

  const isNew = (n: Note) => (n.kind === "deadline" ? !!n.urgent : n.kind !== "review" && n.at > seen);
  const badge = notes?.filter(isNew).length ?? 0;
  const deadlines = notes?.filter((n) => n.kind === "deadline") ?? [];
  const activity = (notes ?? []).filter((n) => n.kind !== "deadline").sort((a, b) => b.at - a.at);
  const shown = tab === "deadline" ? deadlines : tab === "activity" ? activity : [...deadlines.filter((n) => n.urgent), ...activity, ...deadlines.filter((n) => !n.urgent)];

  const markSeen = (open: boolean) => {
    if (open) return;
    const now = Date.now();
    setSeen(now);
    try {
      localStorage.setItem(SEEN_KEY, String(now));
    } catch {}
  };

  return (
    <Popover onOpenChange={markSeen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-10 items-center justify-center rounded-xl border bg-white text-zinc-600 transition-colors hover:bg-zinc-50 data-[state=open]:bg-zinc-50"
        >
          <Bell className="size-4" />
          {!!badge && (
            <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white ring-2 ring-white">
              {badge}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[360px] rounded-xl p-0">
        <div className="flex items-center justify-between border-b px-4 pb-2 pt-3">
          <div className="text-[14px] font-semibold">Notifications</div>
          <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 text-xs">
            {(["all", "deadline", "activity"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn("rounded-md px-2 py-1 transition-colors", tab === t ? "bg-white font-medium shadow-[0_1px_2px_rgb(16_24_40/0.08)]" : "text-zinc-600 hover:text-foreground")}
              >
                {{ all: "All", deadline: "Deadlines", activity: "Activity" }[t]}
              </button>
            ))}
          </div>
        </div>
        <ul className="max-h-[380px] divide-y overflow-y-auto">
          {notes === null && <li className="px-4 py-5 text-xs text-muted-foreground">Loading…</li>}
          {notes && shown.length === 0 && <li className="px-4 py-5 text-xs text-muted-foreground">You&apos;re all caught up.</li>}
          {shown.map((n) => {
            const k = ICON[n.kind];
            return (
              <li key={n.id}>
                <Link href={n.href} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-50">
                  <span className={cn("icon-tile size-8 rounded-lg", k.cls)}><k.icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[13px] font-medium leading-snug">{n.title}</span>
                    <span className={cn("block text-xs", n.urgent ? "text-amber-700" : "text-muted-foreground")}>{n.sub}</span>
                  </span>
                  {isNew(n) && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-500" aria-label="new" />}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link href={`/dashboard/deadlines?lens=${lens}`} className="flex items-center justify-center gap-1 border-t px-4 py-2.5 text-[13px] font-medium text-navy hover:bg-zinc-50">
          All deadlines <ArrowRight className="size-3.5" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
