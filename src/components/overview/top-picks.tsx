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

function ScoreRing({ value, rank }: { value: number; rank: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#f1f1f3" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={rank === 1 ? "#dfae32" : "#002444"} strokeWidth="6" strokeLinecap="round"
          className="ring-fill"
          style={{ strokeDasharray: c, strokeDashoffset: c * (1 - value / 100), ["--ring-c" as string]: c, animationDelay: `${0.1 * rank}s` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold leading-none tabular">{Math.round(value)}</span>
        <span className="text-[10px] text-muted-foreground">score</span>
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
            <Link href={`/dashboard/startups/${r.id}?lens=${lens}`} className="flex h-full flex-col">
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
                {r.promise != null && <ScoreRing value={r.promise} rank={i + 1} />}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {LEVELS.map((l) => {
                  const v = r.levels[l.k] ?? 0;
                  return (
                    <div key={l.k}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-muted-foreground">{l.label}</span>
                        <span className="text-xs font-semibold tabular" style={{ color: l.color }}>{v}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div className="bar-grow h-1.5 rounded-full" style={{ background: l.color, width: `${(v / 9) * 100}%`, animationDelay: `${0.2 + i * 0.08}s` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {r.headline && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-zinc-600">{r.headline}</p>}

              <div className="mt-auto space-y-2 pt-4 text-sm">
                {r.topInvestor && (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/70 px-3 py-2">
                    <span className="text-xs text-muted-foreground">{investorLabel}</span>
                    <span className="truncate font-medium">{r.topInvestor.name.replace(/\s*\(.*\)$/, "")}</span>
                  </div>
                )}
                {r.nextStep && (
                  <div className="flex items-start gap-2 text-zinc-700">
                    <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-navy" />
                    <span className="line-clamp-2">{r.nextStep.title}</span>
                  </div>
                )}
              </div>
            </Link>
          </SpotlightCard>
        </motion.div>
      ))}
    </div>
  );
}
