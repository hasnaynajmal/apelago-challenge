"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BrainCircuit, Check, CircleAlert, FileText, Globe, Loader2, Network, Route, Sparkles, TriangleAlert } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { quadrantOf } from "@/lib/quadrant";
import { QUADRANTS } from "@/components/pipeline/quadrants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventRow {
  id: number;
  step: string;
  agent: string | null;
  status: "started" | "progress" | "done" | "error";
  message: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

const STEPS = [
  { id: "scout", label: "Research", icon: Globe },
  { id: "assess", label: "Readiness committee", icon: BrainCircuit },
  { id: "match", label: "Matching", icon: Network },
  { id: "connect", label: "Hidden connections", icon: Route },
  { id: "narrate", label: "Match explanations", icon: FileText },
  { id: "strategy", label: "Action plan", icon: Sparkles },
] as const;

const LEVELS = [
  { k: "trl", label: "Tech", color: "#0891b2" },
  { k: "brl", label: "Business", color: "#2563eb" },
  { k: "oirl", label: "Impact", color: "#059669" },
  { k: "irl", label: "Invest", color: "#a87c12" },
] as const;

export function LiveRun({ runId, startupId, startupName, lens }: { runId: string; startupId: string; startupName: string; lens: string }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [status, setStatus] = useState<"running" | "done" | "error">("running");
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState<{ promise: number; fit: number } | null>(null);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const router = useRouter();
  const started = useRef<number | null>(null);
  const sawRunning = useRef(false);
  const feedEnd = useRef<HTMLDivElement>(null);

  // Live events: Realtime subscription + polling backfill.
  useEffect(() => {
    const db = supabaseBrowser();
    let alive = true;
    const add = (rows: EventRow[]) =>
      setEvents((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        return [...prev, ...rows.filter((r) => !seen.has(r.id))].sort((a, b) => a.id - b.id);
      });
    const channel = db
      .channel(`run-${runId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pipeline_events", filter: `run_id=eq.${runId}` }, (p) => add([p.new as EventRow]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pipeline_runs", filter: `id=eq.${runId}` }, (p) => {
        const s = (p.new as { status: string }).status;
        if (s === "running") sawRunning.current = true;
        if (s === "done" || s === "error") setStatus(s);
      })
      .subscribe();
    const poll = async () => {
      const [{ data: ev }, { data: run }] = await Promise.all([
        db.from("pipeline_events").select("*").eq("run_id", runId).order("id"),
        db.from("pipeline_runs").select("status,started_at").eq("id", runId).maybeSingle(),
      ]);
      if (!alive) return;
      if (ev) add(ev as EventRow[]);
      if (run?.started_at && started.current == null) started.current = new Date(run.started_at).getTime();
      if (run?.status === "running") sawRunning.current = true;
      if (run?.status === "done" || run?.status === "error") setStatus(run.status);
    };
    poll();
    const iv = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(iv);
      db.removeChannel(channel);
    };
  }, [runId]);

  // Elapsed timer while running.
  useEffect(() => {
    if (status !== "running") return;
    const iv = setInterval(() => started.current && setElapsed(Math.round((Date.now() - started.current) / 1000)), 500);
    return () => clearInterval(iv);
  }, [status]);

  // Run finished while we watched: open the venture page after a short countdown.
  const venturePath = `/dashboard/startups/${startupId}?lens=${lens}`;
  useEffect(() => {
    if (status === "done" && sawRunning.current) setRedirectIn(4);
  }, [status]);
  useEffect(() => {
    if (redirectIn == null) return;
    if (redirectIn <= 0) {
      router.push(venturePath);
      return;
    }
    const t = setTimeout(() => setRedirectIn((n) => (n == null ? n : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [redirectIn, router, venturePath]);

  // Final score once done.
  useEffect(() => {
    if (status !== "done") return;
    supabaseBrowser().from("scores").select("promise,thesis_fit").eq("startup_id", startupId).eq("thesis_id", lens).maybeSingle()
      .then(({ data }) => data && setScore({ promise: data.promise, fit: data.thesis_fit }));
  }, [status, startupId, lens]);

  // Keep the newest feed item in view.
  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [events.length]);

  const stepInfo = useMemo(() => {
    const out: Record<string, { state: "idle" | "running" | "done" | "error"; note: string | null }> = {};
    for (const s of STEPS) {
      const ev = events.filter((e) => e.step === s.id);
      const last = ev[ev.length - 1];
      out[s.id] = {
        state: ev.some((e) => e.status === "error") ? "error" : ev.some((e) => e.status === "done") ? "done" : ev.length ? "running" : "idle",
        note: last?.message ?? null,
      };
    }
    return out;
  }, [events]);
  const doneCount = STEPS.filter((s) => stepInfo[s.id].state === "done").length;
  const progress = status === "done" ? 100 : Math.round((doneCount / STEPS.length) * 100);
  const current = STEPS.find((s) => stepInfo[s.id].state === "running");
  const error = events.find((e) => e.status === "error");
  const levels = events.find((e) => e.step === "assess" && e.status === "done")?.payload as Record<string, number> | undefined;
  const readiness = levels ? (levels.trl + levels.brl + levels.irl) / 3 : null;
  const quadrant = score && readiness != null ? quadrantOf(readiness, score.fit) : null;
  const finalSeconds = events.length > 1 ? Math.round((new Date(events[events.length - 1].created_at).getTime() - new Date(events[0].created_at).getTime()) / 1000) : elapsed;

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={cn("card-surface p-5", status === "done" && "border-emerald-200", status === "error" && "border-red-200")}>
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              status === "done" ? "bg-emerald-50 text-emerald-600" : status === "error" ? "bg-red-50 text-red-600" : "bg-navy-soft text-navy",
            )}
          >
            {status === "done" ? <Check className="size-5" /> : status === "error" ? <CircleAlert className="size-5" /> : <Loader2 className="size-5 animate-spin" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              {status === "done" ? `Assessment complete in ${finalSeconds}s` : status === "error" ? "Assessment failed" : current ? `${current.label}…` : "Starting…"}
            </div>
            <div className="text-xs text-muted-foreground">
              {status === "running" ? (
                `${elapsed}s elapsed · ${doneCount} of ${STEPS.length} steps done`
              ) : status === "error" ? (
                error?.message
              ) : redirectIn != null ? (
                <>
                  Opening the venture page in {Math.max(redirectIn, 0)}s ·{" "}
                  <button type="button" onClick={() => setRedirectIn(null)} className="underline underline-offset-2 hover:text-foreground">
                    Stay here
                  </button>
                </>
              ) : (
                "All agents have reported back"
              )}
            </div>
          </div>
          {status === "done" && (
            <div className="flex items-center gap-4">
              {score && (
                <div className="text-right">
                  <div className="text-2xl font-semibold leading-none tabular">{Math.round(score.promise)}</div>
                  <div className="text-xs text-muted-foreground">score</div>
                </div>
              )}
              {quadrant && (
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", QUADRANTS[quadrant].badge)}>{QUADRANTS[quadrant].label}</span>
              )}
              <Button asChild className="rounded-lg">
                <Link href={venturePath}>Open {startupName} <ArrowRight /></Link>
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn("h-full rounded-full", status === "error" ? "bg-red-500" : status === "done" ? "bg-emerald-500" : "bg-navy")}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Steps */}
        <div className="card-surface p-5">
          <h2 className="text-sm font-semibold">Pipeline</h2>
          <ol className="relative mt-4 space-y-4">
            <span className="absolute bottom-3 left-[13px] top-3 w-px bg-border" aria-hidden />
            {STEPS.map((s) => {
              const { state, note } = stepInfo[s.id];
              return (
                <li key={s.id} className="relative flex gap-3">
                  <span
                    className={cn(
                      "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-white",
                      state === "done" && "border-emerald-600 bg-emerald-600 text-white",
                      state === "running" && "border-navy text-navy",
                      state === "error" && "border-red-600 text-red-600",
                      state === "idle" && "text-zinc-300",
                    )}
                  >
                    {state === "done" ? <Check className="size-3.5" /> : state === "running" ? <Loader2 className="size-3.5 animate-spin" /> : state === "error" ? <CircleAlert className="size-3.5" /> : <s.icon className="size-3.5" />}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <div className={cn("text-sm font-medium", state === "idle" && "text-muted-foreground")}>{s.label}</div>
                    {note && state !== "idle" && <div className="line-clamp-2 text-xs text-muted-foreground">{note}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-6">
          {/* Results so far */}
          {levels && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-5">
              <h2 className="text-sm font-semibold">Readiness</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {LEVELS.map((l) => (
                  <div key={l.k} className="rounded-xl bg-muted/60 p-3">
                    <div className="text-xs text-muted-foreground">{l.label}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold tabular" style={{ color: l.color }}>{levels[l.k]}</span>
                      <span className="text-xs text-muted-foreground">/ 9</span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-white">
                      <div className="bar-grow h-1 rounded-full" style={{ width: `${(levels[l.k] / 9) * 100}%`, background: l.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Feed */}
          <div className="card-surface flex max-h-[560px] flex-col">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold">Live feed</h2>
              {status === "running" && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              )}
            </div>
            <ul className="flex-1 overflow-y-auto px-5 py-3">
              <AnimatePresence initial={false}>
                {events.map((e) => {
                  const warn = Boolean((e.payload as { warning?: string } | null)?.warning);
                  return (
                    <motion.li key={e.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 py-2">
                      <span className="w-11 shrink-0 pt-0.5 text-xs text-muted-foreground tabular">
                        {new Date(e.created_at).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })}
                      </span>
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          e.status === "error" ? "bg-red-500" : warn ? "bg-amber-500" : e.status === "done" ? "bg-emerald-500" : e.status === "started" ? "bg-navy" : "bg-zinc-300",
                        )}
                      />
                      <div className="min-w-0">
                        <span className="mr-2 text-xs font-medium text-muted-foreground">{e.agent ?? e.step}</span>
                        <span className={cn("text-sm", warn ? "text-amber-700" : e.status === "error" ? "text-red-600" : "text-zinc-800")}>
                          {warn && <TriangleAlert className="mr-1 inline size-3.5 -translate-y-px" />}
                          {e.message}
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
              {events.length === 0 && (
                <li className="flex items-center gap-2 py-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Waiting for the committee…</li>
              )}
              <div ref={feedEnd} />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
