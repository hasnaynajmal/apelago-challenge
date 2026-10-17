"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FRAMEWORKS, type Framework } from "@/lib/taxonomy";
import type { Assessment } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLOR: Record<Framework, { text: string; bg: string; hex: string }> = {
  trl: { text: "text-tech", bg: "bg-tech", hex: "#4acceb" },
  brl: { text: "text-business", bg: "bg-business", hex: "#7eb7c1" },
  oirl: { text: "text-impact", bg: "bg-impact", hex: "#3db774" },
  irl: { text: "text-invest", bg: "bg-invest", hex: "#dfae32" },
};

export function ReadinessCard({ framework, a }: { framework: Framework; a?: Assessment }) {
  const [open, setOpen] = useState(false);
  const meta = FRAMEWORKS[framework];
  const c = COLOR[framework];
  if (!a) {
    return (
      <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
        {meta.label}: not assessed yet
      </div>
    );
  }
  const dist = a.distribution ?? null;
  const maxP = dist ? Math.max(...Object.values(dist)) : 1;
  const jevLevel = (a.details as { jev_level?: number } | null)?.jev_level;

  return (
    <div className={cn("glass glass-hover flex flex-col rounded-2xl p-4", a.needs_review && "border-warn/40")}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{meta.short}</div>
          <div className="text-xs text-ice/70">{meta.label}</div>
        </div>
        {a.needs_review && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 rounded-full bg-warn/15 px-2 py-0.5 text-[10px] font-semibold text-warn">
                <TriangleAlert className="size-3" /> Review
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-60">
              The calibrated model (Jev) confidently disagrees with the analyst agent{jevLevel ? ` (Jev: ${meta.short} ${jevLevel})` : ""}. A human should confirm.
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("text-5xl font-bold leading-none tabular", c.text)}
        >
          {a.level}
        </motion.span>
        <span className="mb-1 text-sm text-muted-foreground">/ {meta.max}</span>
        <span className="mb-1 ml-auto text-[11px] text-muted-foreground">
          conf. <span className="tabular text-ice">{Math.round((a.confidence ?? 0) * 100)}%</span>
        </span>
      </div>

      {/* level scale with calibrated distribution */}
      <div className="mt-4">
        <div className="flex h-10 items-end gap-1">
          {Array.from({ length: meta.max }, (_, i) => i + 1).map((lvl) => {
            const p = dist?.[lvl] ?? 0;
            return (
              <Tooltip key={lvl}>
                <TooltipTrigger asChild>
                  <div className="flex h-full flex-1 flex-col justify-end">
                    {dist && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(4, (p / maxP) * 100)}%` }}
                        transition={{ delay: lvl * 0.03 }}
                        className="w-full rounded-t-sm"
                        style={{ background: c.hex, opacity: 0.25 + 0.6 * (p / maxP) }}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {meta.short} {lvl}
                  {dist ? ` · calibrated probability ${(p * 100).toFixed(0)}%` : ""}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="mt-1 flex gap-1">
          {Array.from({ length: meta.max }, (_, i) => i + 1).map((lvl) => (
            <div
              key={lvl}
              className={cn("h-1.5 flex-1 rounded-full", lvl <= a.level ? c.bg : "bg-muted")}
              style={lvl === a.level ? { boxShadow: `0 0 10px ${c.hex}` } : undefined}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground tabular">
          <span>1</span>
          <span>{dist ? "bars = calibrated probability (Jev)" : "analyst assessment"}</span>
          <span>{meta.max}</span>
        </div>
      </div>

      <p className={cn("mt-3 text-xs leading-relaxed text-ice/80", !open && "line-clamp-3")}>{a.rationale}</p>
      {open && a.next_requirements.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">To reach {meta.short} {Math.min(meta.max, a.level + 1)}</div>
          <ul className="mt-1 space-y-1 text-xs text-ice/80">
            {a.next_requirements.slice(0, 4).map((r) => (
              <li key={r} className="flex gap-2"><span className={c.text}>→</span>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {open && a.gaps.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Data gaps</div>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {a.gaps.slice(0, 4).map((g) => <li key={g}>· {g}</li>)}
          </ul>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="mt-auto flex items-center gap-1 pt-3 text-[11px] text-muted-foreground hover:text-foreground">
        {open ? "Less" : "Why this level"} <ChevronDown className={cn("size-3 transition", open && "rotate-180")} />
      </button>
    </div>
  );
}
