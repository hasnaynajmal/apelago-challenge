"use client";

import { useState } from "react";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FRAMEWORKS, type Framework } from "@/lib/taxonomy";
import type { Assessment } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<Framework, { text: string; hex: string }> = {
  trl: { text: "text-tech", hex: "#0891b2" },
  brl: { text: "text-business", hex: "#2563eb" },
  oirl: { text: "text-impact", hex: "#059669" },
  irl: { text: "text-invest", hex: "#a87c12" },
};

/** The four readiness cards; "Why this level" opens and closes all of them together so the row stays even. */
export function ReadinessGrid({ assessments }: { assessments: Partial<Record<Framework, Assessment>> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {(["trl", "brl", "oirl", "irl"] as const).map((f) => (
        <ReadinessCard key={f} framework={f} a={assessments[f]} open={open} onToggle={() => setOpen(!open)} />
      ))}
    </div>
  );
}

function ReadinessCard({ framework, a, open, onToggle }: { framework: Framework; a?: Assessment; open: boolean; onToggle: () => void }) {
  const meta = FRAMEWORKS[framework];
  const tone = TONE[framework];
  if (!a) return <div className="card-surface p-5 text-muted-foreground">{meta.label}: not assessed</div>;

  const dist = a.distribution;
  const maxP = dist ? Math.max(...Object.values(dist)) : 1;
  const jevLevel = (a.details as { jev_level?: number } | null)?.jev_level;

  return (
    <div className={cn("card-surface card-hover flex flex-col p-6", a.needs_review && "border-amber-300")}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium">{meta.label}</div>
        {a.needs_review ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-warn">
                <TriangleAlert className="size-3.5" /> Review
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-sm">
              The calibrated model (Jev) confidently disagrees with the analyst agent{jevLevel ? ` — it estimates ${meta.short} ${jevLevel}` : ""}. A human should confirm.
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-sm text-muted-foreground">{meta.short}</span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={cn("text-3xl font-semibold tracking-tight tabular", tone.text)}>
          {a.level}
        </span>
        <span className="text-sm text-muted-foreground">/ {meta.max}</span>
        <span className="ml-auto text-xs text-muted-foreground">{Math.round((a.confidence ?? 0) * 100)}% confident</span>
      </div>

      <div className="mt-4">
        <div className="flex h-7 items-end gap-1">
          {Array.from({ length: meta.max }, (_, i) => i + 1).map((lvl) => {
            const p = dist?.[lvl] ?? 0;
            const isLevel = lvl === a.level;
            return (
              <Tooltip key={lvl}>
                <TooltipTrigger asChild>
                  <div className="flex h-full flex-1 flex-col justify-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: dist ? `${Math.max(8, (p / maxP) * 100)}%` : isLevel ? "100%" : "18%" }}
                      transition={{ delay: lvl * 0.03 }}
                      className="w-full rounded-[3px]"
                      style={{ background: isLevel || (dist && p === maxP) ? tone.hex : "#e4e4e7", opacity: dist && !isLevel ? 0.35 + 0.65 * (p / maxP) : 1 }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-sm">
                  {meta.short} {lvl}
                  {dist ? ` · ${Math.round(p * 100)}% calibrated probability` : ""}
                  {isLevel ? " · analyst level" : ""}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <p title={a.rationale ?? undefined} className={cn("mt-4 text-sm leading-relaxed text-zinc-600", open ? "line-clamp-6" : "line-clamp-2")}>{a.rationale}</p>

      {open && (
        <div className="mt-4 space-y-4">
          {a.next_requirements.length > 0 && (
            <div>
              <div className="text-sm font-medium">To reach {meta.short} {Math.min(meta.max, a.level + 1)}</div>
              <ul className="mt-1.5 space-y-1.5 text-sm text-zinc-600">
                {a.next_requirements.slice(0, 2).map((r) => (
                  <li key={r} className="flex gap-2" title={r}><span className={tone.text}>→</span><span className="line-clamp-2">{r}</span></li>
                ))}
              </ul>
            </div>
          )}
          {a.gaps.length > 0 && (
            <div>
              <div className="text-sm font-medium">Missing evidence</div>
              <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                {a.gaps.slice(0, 2).map((g) => <li key={g} title={g} className="line-clamp-2">· {g}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
      <button onClick={onToggle} className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-navy hover:underline">
        {open ? "Show less" : "Why this level"} <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
      </button>
    </div>
  );
}
