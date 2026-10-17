"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, CircleAlert, Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventRow {
  id: number;
  step: string;
  agent: string | null;
  status: "started" | "progress" | "done" | "error";
  message: string | null;
  created_at: string;
}

const STEPS = [
  { id: "scout", label: "Scout", sub: "Web research & evidence" },
  { id: "assess", label: "Committee", sub: "TRL · BRL · Ocean Impact · Investment · Jev calibration" },
  { id: "match", label: "Matchmaker", sub: "42 investors · 32 funding · 42 partners" },
  { id: "connect", label: "Connector", sub: "Warm paths, unlocks, consortia" },
  { id: "narrate", label: "Narrator", sub: "Explains every top match" },
  { id: "strategy", label: "Strategist", sub: "Action plan" },
] as const;

export function LiveRun({ runId, startupId, startupName, lens }: { runId: string; startupId: string; startupName: string; lens: string }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [status, setStatus] = useState<"running" | "done" | "error">("running");
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(Date.now());

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
        if (s === "done" || s === "error") setStatus(s);
      })
      .subscribe();

    // Backfill + polling fallback in case Realtime is slow to connect.
    const poll = async () => {
      const [{ data: ev }, { data: run }] = await Promise.all([
        db.from("pipeline_events").select("*").eq("run_id", runId).order("id"),
        db.from("pipeline_runs").select("status").eq("id", runId).maybeSingle(),
      ]);
      if (!alive) return;
      if (ev) add(ev as EventRow[]);
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

  useEffect(() => {
    if (status !== "running") return;
    const iv = setInterval(() => setElapsed(Math.round((Date.now() - started.current) / 1000)), 500);
    return () => clearInterval(iv);
  }, [status]);

  const stepState = useMemo(() => {
    const st: Record<string, "idle" | "running" | "done" | "error"> = {};
    for (const s of STEPS) {
      const ev = events.filter((e) => e.step === s.id);
      st[s.id] = ev.some((e) => e.status === "error") ? "error" : ev.some((e) => e.status === "done") ? "done" : ev.length ? "running" : "idle";
    }
    return st;
  }, [events]);
  const doneCount = STEPS.filter((s) => stepState[s.id] === "done").length;
  const error = events.find((e) => e.status === "error");

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* Pipeline */}
      <div className="glass rounded-3xl p-5">
        <div className="relative mx-auto mb-6 flex size-44 items-center justify-center">
          {status === "running" &&
            [0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border border-gold/40"
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 1.15, opacity: 0 }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
              />
            ))}
          <div className="absolute inset-6 rounded-full border border-border bg-navy-950/40" />
          <div className="relative text-center">
            <div className="text-4xl font-bold tabular text-gradient-gold">{Math.round((doneCount / STEPS.length) * 100)}%</div>
            <div className="text-[11px] text-muted-foreground">{status === "running" ? `${elapsed}s elapsed` : status === "done" ? "Complete" : "Failed"}</div>
          </div>
        </div>
        <ol className="space-y-2">
          {STEPS.map((s) => {
            const state = stepState[s.id];
            return (
              <li key={s.id} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition", state === "running" && "bg-gold/10")}>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border",
                    state === "done" && "border-impact bg-impact/20 text-impact",
                    state === "running" && "border-gold text-gold",
                    state === "error" && "border-risk text-risk",
                    state === "idle" && "border-border text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="size-3.5" /> : state === "running" ? <Loader2 className="size-3.5 animate-spin" /> : state === "error" ? <CircleAlert className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
                </span>
                <div>
                  <div className={cn("text-sm font-semibold", state === "idle" && "text-muted-foreground")}>{s.label}</div>
                  <div className="text-[11px] text-muted-foreground">{s.sub}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Live feed */}
      <div className="glass flex min-h-[560px] flex-col rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-sm font-semibold">Committee feed · {startupName}</div>
            <div className="text-xs text-muted-foreground">Streaming live from the agents via Supabase Realtime</div>
          </div>
          {status === "done" && (
            <Button asChild>
              <Link href={`/startups/${startupId}?lens=${lens}`}>Open dossier <ArrowRight /></Link>
            </Button>
          )}
        </div>
        <ul className="flex-1 space-y-2 overflow-y-auto p-4">
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, x: -12, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className={cn(
                  "flex gap-3 rounded-xl border px-3 py-2.5 text-sm",
                  e.status === "error" ? "border-risk/40 bg-risk/10" : e.status === "done" ? "border-impact/25 bg-impact/5" : "border-border bg-navy-950/30",
                )}
              >
                <span className="w-14 shrink-0 pt-0.5 text-[10px] text-muted-foreground tabular">
                  {new Date(e.created_at).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })}
                </span>
                <div className="min-w-0">
                  <div className={cn("text-[11px] font-semibold uppercase tracking-wider", e.status === "done" ? "text-impact" : e.status === "error" ? "text-risk" : "text-gold")}>
                    {e.agent ?? e.step}
                  </div>
                  <div className="text-ice/85">{e.message}</div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
          {events.length === 0 && (
            <li className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Waiting for the committee…</li>
          )}
        </ul>
        {error && <div className="border-t border-border px-5 py-3 text-sm text-risk">Run failed: {error.message}</div>}
      </div>
    </div>
  );
}
