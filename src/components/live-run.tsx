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
  { id: "scout", label: "Scout", sub: "Researches the web and gathers evidence" },
  { id: "assess", label: "Committee", sub: "Technology, business, ocean impact and investment readiness" },
  { id: "match", label: "Matchmaker", sub: "Scores every investor, grant and partner" },
  { id: "connect", label: "Connector", sub: "Finds warm paths, unlocks and consortia" },
  { id: "narrate", label: "Narrator", sub: "Explains the top matches" },
  { id: "strategy", label: "Strategist", sub: "Writes the action plan" },
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
    // Backfill and fallback polling in case Realtime is slow to connect.
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
  const progress = Math.round((STEPS.filter((s) => stepState[s.id] === "done").length / STEPS.length) * 100);
  const error = events.find((e) => e.status === "error");

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
      <div className="card-surface p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-semibold tracking-tight tabular">{progress}%</span>
          <span className="text-sm text-muted-foreground">{status === "running" ? `${elapsed}s` : status === "done" ? "Complete" : "Failed"}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-navy" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 80, damping: 20 }} />
        </div>
        <ol className="mt-6 space-y-1">
          {STEPS.map((s) => {
            const state = stepState[s.id];
            return (
              <li key={s.id} className={cn("flex items-start gap-3 rounded-xl px-3 py-3 transition-colors", state === "running" && "bg-muted")}>
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                    state === "done" && "border-emerald-600 bg-emerald-600 text-white",
                    state === "running" && "border-navy text-navy",
                    state === "error" && "border-red-600 text-red-600",
                    state === "idle" && "text-zinc-300",
                  )}
                >
                  {state === "done" ? <Check className="size-3.5" /> : state === "running" ? <Loader2 className="size-3.5 animate-spin" /> : state === "error" ? <CircleAlert className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
                </span>
                <div>
                  <div className={cn("text-sm font-medium", state === "idle" && "text-muted-foreground")}>{s.label}</div>
                  <div className="text-sm text-muted-foreground">{s.sub}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="card-surface flex min-h-[600px] flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-sm font-semibold">Live feed</div>
            <div className="text-sm text-muted-foreground">Streaming from the agents as they work</div>
          </div>
          {status === "done" && (
            <Button asChild className="rounded-full">
              <Link href={`/dashboard/startups/${startupId}?lens=${lens}`}>Open {startupName} <ArrowRight /></Link>
            </Button>
          )}
        </div>
        <ul className="flex-1 space-y-2 overflow-y-auto p-5">
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-4 rounded-xl border px-4 py-3", e.status === "error" ? "border-red-200 bg-red-50" : e.status === "done" ? "border-emerald-100 bg-emerald-50/50" : "bg-white")}
              >
                <span className="w-12 shrink-0 pt-0.5 text-sm text-muted-foreground tabular">
                  {new Date(e.created_at).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-500">{e.agent ?? e.step}</div>
                  <div className="text-sm text-zinc-800">{e.message}</div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
          {events.length === 0 && (
            <li className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Waiting for the committee…</li>
          )}
        </ul>
        {error && <div className="border-t px-6 py-3 text-sm text-red-600">Run failed: {error.message}</div>}
      </div>
    </div>
  );
}
