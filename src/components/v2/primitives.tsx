// UI v2 building blocks: panels, stat cards, avatar tiles, group pills, readiness dashes and the score gauge.
// Server-safe (no hooks), so pages can use them directly.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QUADRANTS } from "@/components/pipeline/quadrants";
import type { Quadrant } from "@/lib/quadrant";
import { cn } from "@/lib/utils";

export const TINTS = {
  navy: "bg-navy-soft text-navy",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
  gold: "bg-gold-soft text-gold-ink",
} as const;
export type Tint = keyof typeof TINTS;

/** White rounded panel with an optional header row (title, subtitle, action on the right). */
export function Panel({
  title, sub, action, children, className, bodyClassName, flush,
}: {
  title?: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode;
  className?: string; bodyClassName?: string; flush?: boolean;
}) {
  return (
    <section className={cn("card-surface flex min-w-0 flex-col", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>}
            {sub && <p className="mt-0.5 text-[13px] text-muted-foreground">{sub}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(flush ? "" : "px-5 pb-5 pt-3", "min-w-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small "View all" style button for panel headers. */
export function PanelLink({ href, children = "View all" }: { href: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-8 items-center gap-1 rounded-lg border bg-white px-2.5 text-[13px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
      {children} <ArrowRight className="size-3.5" />
    </Link>
  );
}

/** KPI card: tinted icon tile, big number, label and an optional hint. */
export function StatCard({
  icon: Icon, tint = "navy", value, label, hint, href, className,
}: {
  icon: React.ElementType; tint?: Tint; value: React.ReactNode; label: string; hint?: React.ReactNode; href?: string; className?: string;
}) {
  const body = (
    <>
      <span className={cn("icon-tile size-10", TINTS[tint])}><Icon className="size-[18px]" /></span>
      <div className="mt-5 text-[28px] font-semibold leading-none tracking-tight text-foreground tabular">{value}</div>
      <div className="mt-2 text-[13px] font-medium text-zinc-700">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </>
  );
  const cls = cn("card-surface block p-5", href && "card-hover", className);
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

const AVATAR_TINTS = ["bg-sky-100 text-sky-800", "bg-emerald-100 text-emerald-800", "bg-violet-100 text-violet-800", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-800", "bg-teal-100 text-teal-800", "bg-indigo-100 text-indigo-800"];

/** Initials tile used as a stand-in logo; the colour is stable per name. */
export function VentureAvatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const initials = name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || name[0];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold",
        AVATAR_TINTS[hash % AVATAR_TINTS.length],
        size === "sm" && "size-8 rounded-lg text-[11px]",
        size === "md" && "size-10 rounded-xl text-[13px]",
        size === "lg" && "size-14 rounded-2xl text-lg",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function GroupPill({ quadrant, className }: { quadrant: Quadrant | null; className?: string }) {
  if (!quadrant) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", QUADRANTS[quadrant].badge, className)}>
      <span className="size-1.5 rounded-full" style={{ background: QUADRANTS[quadrant].dot }} />
      {QUADRANTS[quadrant].label}
    </span>
  );
}

export const LEVEL_META = [
  { k: "trl", label: "Tech", color: "#0891b2" },
  { k: "brl", label: "Business", color: "#2563eb" },
  { k: "oirl", label: "Impact", color: "#059669" },
  { k: "irl", label: "Invest", color: "#a87c12" },
] as const;

/** Four mini bars (TRL, BRL, OIRL, IRL), each filled to level/9. Compact readiness at a glance. */
export function LevelDashes({ levels, showValues = false }: { levels: Partial<Record<"trl" | "brl" | "oirl" | "irl", number | null>>; showValues?: boolean }) {
  return (
    <div className="flex items-end gap-1.5" title={LEVEL_META.map((l) => `${l.label} ${levels[l.k] ?? "–"}`).join(" · ")}>
      {LEVEL_META.map((l) => {
        const v = levels[l.k] ?? 0;
        return (
          <div key={l.k} className="w-7">
            {showValues && <div className="mb-0.5 text-center text-[11px] font-semibold tabular" style={{ color: l.color }}>{v || "–"}</div>}
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full" style={{ width: `${(v / 9) * 100}%`, background: l.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Semicircle gauge for the 0–100 score (pure SVG, no JS). */
export function ScoreGauge({ value, size = 168, label }: { value: number; size?: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = 70;
  const c = Math.PI * r; // half circumference
  return (
    <div className="relative" style={{ width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 180 100" className="h-full w-full">
        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#eef1f5" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          fill="none"
          stroke="url(#gauge)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${(c * v) / 100} ${c}`}
          className="ring-fill"
          style={{ ["--ring-c" as string]: `${(c * v) / 100}` }}
        />
        <defs>
          <linearGradient id="gauge" x1="0" x2="1">
            <stop offset="0%" stopColor="#3b6a96" />
            <stop offset="100%" stopColor="#002444" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-[34px] font-semibold leading-none tracking-tight tabular">{v}</div>
        {label && <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}

/** Thin labelled progress row (label · bar · value). */
export function BarRow({ label, value, max = 100, color = "#002444", suffix = "" }: { label: string; value: number; max?: number; color?: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
        <div className="bar-grow h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="w-9 text-right font-medium tabular">{max <= 10 ? value.toFixed(1) : Math.round(value)}{suffix}</span>
    </div>
  );
}
