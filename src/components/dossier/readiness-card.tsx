"use client";

// Readiness tab: one card per scale, everything visible (the tab has the room). Two columns on desktop.
import { Cpu, Gauge, Landmark, Leaf, TriangleAlert, Briefcase } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FRAMEWORKS, type Framework } from "@/lib/taxonomy";
import type { Assessment } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<Framework, { hex: string; tile: string; icon: React.ElementType; question: string }> = {
  trl: { hex: "#0891b2", tile: "bg-cyan-50 text-cyan-700", icon: Cpu, question: "Does the technology work?" },
  brl: { hex: "#2563eb", tile: "bg-blue-50 text-blue-700", icon: Briefcase, question: "Is there a business?" },
  oirl: { hex: "#059669", tile: "bg-emerald-50 text-emerald-700", icon: Leaf, question: "Does it help the ocean, provably?" },
  irl: { hex: "#a87c12", tile: "bg-gold-soft text-gold-ink", icon: Landmark, question: "Is it ready for investors?" },
};

export function ReadinessGrid({ assessments }: { assessments: Partial<Record<Framework, Assessment>> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(["trl", "brl", "oirl", "irl"] as const).map((f) => (
        <ReadinessCard key={f} framework={f} a={assessments[f]} />
      ))}
    </div>
  );
}

function ReadinessCard({ framework, a }: { framework: Framework; a?: Assessment }) {
  const meta = FRAMEWORKS[framework];
  const tone = TONE[framework];
  if (!a) return <div className="card-surface p-5 text-muted-foreground">{meta.label}: not assessed</div>;

  const dist = a.distribution;
  const maxP = dist ? Math.max(...Object.values(dist)) : 1;
  const jevLevel = (a.details as { jev_level?: number } | null)?.jev_level;
  const Icon = tone.icon;

  return (
    <div className={cn("card-surface flex flex-col p-5", a.needs_review && "ring-1 ring-amber-300")}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className={cn("icon-tile size-10", tone.tile)}><Icon className="size-[18px]" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold">{meta.label}</span>
            <span className="rounded-md bg-zinc-100 px-1.5 text-[11px] font-medium text-zinc-600">{meta.short}</span>
          </div>
          <div className="text-[13px] text-muted-foreground">{tone.question}</div>
        </div>
        {a.needs_review && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <TriangleAlert className="size-3.5" /> Review
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-sm">
              The Second Opinion model disagrees with the assessor{jevLevel ? ` — it estimates ${meta.short} ${jevLevel}` : ""}. A human should confirm.
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Level + distribution */}
      <div className="mt-4 flex items-end gap-5">
        <div className="shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-[40px] font-semibold leading-none tracking-tight tabular" style={{ color: tone.hex }}>{a.level}</span>
            <span className="text-sm text-muted-foreground">/ {meta.max}</span>
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            <Gauge className="size-3" /> {Math.round((a.confidence ?? 0) * 100)}% confident
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex h-12 items-end gap-1">
            {Array.from({ length: meta.max }, (_, i) => i + 1).map((lvl) => {
              const p = dist?.[lvl] ?? 0;
              const isLevel = lvl === a.level;
              const h = dist ? Math.max(10, (p / maxP) * 100) : isLevel ? 100 : 14;
              return (
                <Tooltip key={lvl}>
                  <TooltipTrigger asChild>
                    <div className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                      <div
                        className="w-full rounded-[4px]"
                        style={{ height: `${h}%`, background: isLevel ? tone.hex : dist && p === maxP ? tone.hex : "#e4e7ec", opacity: isLevel || !dist ? 1 : 0.35 + 0.65 * (p / maxP) }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-sm">
                    {meta.short} {lvl}
                    {dist ? ` · ${Math.round(p * 100)}% likely (Second Opinion)` : ""}
                    {isLevel ? " · assessed level" : ""}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-zinc-400 tabular"><span>1</span><span>{meta.max}</span></div>
        </div>
      </div>

      {/* Reasoning */}
      {a.rationale && <p title={a.rationale} className="mt-4 line-clamp-4 text-[13.5px] leading-relaxed text-zinc-700">{a.rationale}</p>}

      {(a.next_requirements.length > 0 || a.gaps.length > 0) && (
        <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
          {a.next_requirements.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground">To reach {meta.short} {Math.min(meta.max, a.level + 1)}</div>
              <ul className="mt-1.5 space-y-1.5 text-[13px] text-zinc-600">
                {a.next_requirements.slice(0, 2).map((r) => (
                  <li key={r} className="flex gap-2" title={r}>
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full" style={{ background: tone.hex }} />
                    <span className="line-clamp-2">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {a.gaps.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground">Missing evidence</div>
              <ul className="mt-1.5 space-y-1.5 text-[13px] text-muted-foreground">
                {a.gaps.slice(0, 2).map((g) => (
                  <li key={g} className="flex gap-2" title={g}>
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-zinc-300" />
                    <span className="line-clamp-2">{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
