"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { CountryLabel } from "@/components/country";
import { QUADRANTS } from "@/components/pipeline/quadrants";
import type { PipelineRow } from "@/lib/queries";
import { SECTORS } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

const LEVELS = [
  { k: "trl", label: "Tech", color: "#0891b2" },
  { k: "brl", label: "Business", color: "#2563eb" },
  { k: "oirl", label: "Impact", color: "#059669" },
  { k: "irl", label: "Invest", color: "#a87c12" },
] as const;

/** Plain score display: large number, "/100", thin bar. */
function Score({ value, top }: { value: number; top: boolean }) {
  return (
    <div className="w-20 shrink-0 text-right">
      <div className="flex items-baseline justify-end gap-0.5">
        <span className="text-3xl font-semibold leading-none tracking-tight tabular">{Math.round(value)}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted">
        <div className={cn("bar-grow h-1.5 rounded-full", top ? "bg-gold" : "bg-navy")} style={{ width: `${Math.round(value)}%` }} />
      </div>
    </div>
  );
}

export function TopPicks({ rows, lens, investorLabel }: { rows: PipelineRow[]; lens: string; investorLabel: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {rows.map((r, i) => (
        <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <SpotlightCard theme="light" spotlightColor="rgba(0, 36, 68, 0.35)" style={{ padding: 20, borderRadius: 16, height: "100%" }}>
            <Link href={`/dashboard/startups/${r.id}?lens=${lens}`} className="group flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("flex size-5 items-center justify-center rounded-full text-[11px] font-semibold", i === 0 ? "bg-gold text-navy" : "bg-muted text-zinc-600")}>
                      {i + 1}
                    </span>
                    {r.quadrant && <span className="text-xs font-medium" style={{ color: QUADRANTS[r.quadrant].dot }}>{QUADRANTS[r.quadrant].label}</span>}
                  </div>
                  <div className="mt-2 truncate text-lg font-semibold">{r.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    {r.sectors[0] && <span>{SECTORS[r.sectors[0]]}</span>}
                    {r.country && <CountryLabel code={r.country} />}
                  </div>
                </div>
                {r.promise != null && <Score value={r.promise} top={i === 0} />}
              </div>

              {/* Readiness at a glance: one quiet line (full detail lives on the venture page). */}
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {LEVELS.map((l) => (
                  <span key={l.k}>
                    {l.label} <span className="font-semibold tabular" style={{ color: l.color }}>{r.levels[l.k] ?? "–"}</span>
                  </span>
                ))}
              </div>

              {r.headline && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-600">{r.headline}</p>}

              {r.topInvestor && (
                <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-sm">
                  <span className="text-xs text-muted-foreground">{investorLabel}</span>
                  <span className="flex items-center gap-1 truncate font-medium">
                    {r.topInvestor.name.replace(/\s*\(.*\)$/, "")}
                    <ArrowRight className="size-3.5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-navy" />
                  </span>
                </div>
              )}
            </Link>
          </SpotlightCard>
        </motion.div>
      ))}
    </div>
  );
}
