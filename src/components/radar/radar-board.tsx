"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, CircleDashed, Sparkles, TriangleAlert } from "lucide-react";
import { SECTORS, STAGE_LABELS, type Sector } from "@/lib/taxonomy";
import { PROGRAMMES } from "@/lib/lens";
import type { RadarItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

const SIZE = 760;
const C = SIZE / 2;
const R = 330;
const SECTOR_IDS = Object.keys(SECTORS) as Sector[];
const WEDGE = (2 * Math.PI) / SECTOR_IDS.length;
const RINGS = [
  { label: "HOT", at: 0.3 },
  { label: "WARM", at: 0.55 },
  { label: "WATCH", at: 0.78 },
  { label: "EARLY", at: 1 },
];

function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

function place(item: RadarItem) {
  const sector = SECTOR_IDS.indexOf(item.sectors[0] ?? "climate_software");
  const angle = -Math.PI / 2 + sector * WEDGE + (0.18 + 0.64 * hash01(item.id)) * WEDGE;
  const radius = item.promise == null ? 0.93 : Math.min(0.9, Math.max(0.1, 0.1 + 0.85 * (1 - (item.promise - 30) / 55)));
  return { x: C + Math.cos(angle) * radius * R, y: C + Math.sin(angle) * radius * R };
}

const levelColor = { trl: "text-tech", brl: "text-business", oirl: "text-impact", irl: "text-invest" } as const;

export function RadarBoard({ items, lens }: { items: RadarItem[]; lens: string }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const assessed = items.filter((i) => i.assessed);
  const top = new Set(assessed.slice(0, 3).map((i) => i.id));
  const placed = useMemo(() => items.map((i) => ({ item: i, ...place(i) })), [items]);
  const hovered = placed.find((p) => p.item.id === hover);
  const href = (id: string) => `/startups/${id}?lens=${lens}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      {/* Radar */}
      <div className="glass relative overflow-hidden rounded-3xl p-4">
        <div className="pointer-events-none absolute inset-0 grid-faint opacity-60" />
        <div className="relative mx-auto aspect-square w-full max-w-[760px]">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full" role="img" aria-label="Opportunity radar">
            <defs>
              <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#01498f" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#001b33" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#001835" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#dfae32" stopOpacity="0" />
                <stop offset="100%" stopColor="#dfae32" stopOpacity="0.28" />
              </linearGradient>
            </defs>
            <circle cx={C} cy={C} r={R} fill="url(#radar-bg)" />
            {RINGS.map((ring) => (
              <g key={ring.label}>
                <circle cx={C} cy={C} r={ring.at * R} fill="none" stroke="#cfdee8" strokeOpacity={ring.label === "HOT" ? 0.22 : 0.1} strokeDasharray={ring.label === "EARLY" ? "0" : "2 6"} />
                <text x={C + 6} y={C - ring.at * R + 14} fill="#cfdee8" fillOpacity={0.35} fontSize={10} letterSpacing={2}>
                  {ring.label}
                </text>
              </g>
            ))}
            {SECTOR_IDS.map((s, i) => {
              const a = -Math.PI / 2 + i * WEDGE;
              const mid = a + WEDGE / 2;
              const lx = C + Math.cos(mid) * (R + 22);
              const ly = C + Math.sin(mid) * (R + 22);
              return (
                <g key={s}>
                  <line x1={C} y1={C} x2={C + Math.cos(a) * R} y2={C + Math.sin(a) * R} stroke="#cfdee8" strokeOpacity={0.06} />
                  <text
                    x={lx} y={ly} fill="#8fa6ba" fontSize={10.5} textAnchor={Math.cos(mid) > 0.2 ? "start" : Math.cos(mid) < -0.2 ? "end" : "middle"}
                    dominantBaseline="middle"
                  >
                    {SECTORS[s]}
                  </text>
                </g>
              );
            })}
            {/* sweep */}
            <g className="radar-sweep" style={{ transformOrigin: `${C}px ${C}px` }}>
              <path d={`M ${C} ${C} L ${C + R} ${C} A ${R} ${R} 0 0 0 ${C + Math.cos(-0.55) * R} ${C + Math.sin(-0.55) * R} Z`} fill="url(#sweep)" />
              <line x1={C} y1={C} x2={C + R} y2={C} stroke="#dfae32" strokeOpacity={0.5} strokeWidth={1.2} />
            </g>
            <circle cx={C} cy={C} r={3} fill="#dfae32" />

            {/* blips */}
            {placed.map(({ item, x, y }, idx) => {
              const isTop = top.has(item.id);
              const isHover = hover === item.id;
              const r = item.assessed ? 5 + (item.levels.oirl ?? 3) * 0.9 : 4.5;
              const color = isTop ? "#dfae32" : item.assessed ? "#4acceb" : "#8fa6ba";
              return (
                <motion.g
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1, x, y }}
                  transition={{ delay: idx * 0.025, type: "spring", stiffness: 140, damping: 20 }}
                  onMouseEnter={() => setHover(item.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => router.push(href(item.id))}
                  className="cursor-pointer"
                  style={{ originX: 0, originY: 0 }}
                >
                  {isTop && <circle r={r} fill={color} className="blip-pulse" />}
                  {item.needsReview && <circle r={r + 4} fill="none" stroke="#e6be5c" strokeWidth={1.4} strokeDasharray="2 2" />}
                  <circle
                    r={isHover ? r + 2.5 : r}
                    fill={item.assessed ? color : "transparent"}
                    fillOpacity={item.assessed ? 0.9 : 0}
                    stroke={color}
                    strokeOpacity={item.assessed ? 1 : 0.7}
                    strokeDasharray={item.assessed ? undefined : "2 2.5"}
                    strokeWidth={1.5}
                    style={{ filter: item.assessed ? `drop-shadow(0 0 ${isTop ? 10 : 5}px ${color})` : undefined, transition: "r 0.15s" }}
                  />
                  {(isTop || isHover) && (
                    <text x={r + 6} y={4} fill={isTop ? "#f3d37c" : "#e9f3f8"} fontSize={12} fontWeight={600}>
                      {item.name}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </svg>

          <AnimatePresence>
            {hovered && (
              <motion.div
                key={hovered.item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute z-10 w-64 rounded-xl border border-border bg-popover/95 p-3 text-xs shadow-2xl backdrop-blur"
                style={{
                  left: `${(hovered.x / SIZE) * 100}%`,
                  top: `${(hovered.y / SIZE) * 100}%`,
                  transform: `translate(${hovered.x > C ? "-105%" : "12px"}, ${hovered.y > C ? "-105%" : "12px"})`,
                }}
              >
                <BlipCard item={hovered.item} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="relative mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-gold shadow-[0_0_8px_#dfae32]" /> Top 3 for this lens</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-tech" /> Assessed</span>
          <span className="flex items-center gap-1.5"><CircleDashed className="size-3" /> Not yet assessed</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border border-dashed border-warn" /> Needs human review</span>
          <span>Closer to centre = more promising · size = ocean impact</span>
        </div>
      </div>

      {/* Ranked list */}
      <div className="glass flex max-h-[860px] flex-col rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">Ranked opportunities</h2>
            <p className="text-xs text-muted-foreground">{assessed.length} assessed · {items.length - assessed.length} waiting</p>
          </div>
          <Sparkles className="size-4 text-gold" />
        </div>
        <ol className="flex-1 space-y-1 overflow-y-auto p-2">
          {items.map((item, i) => (
            <li key={item.id}>
              <Link
                href={href(item.id)}
                onMouseEnter={() => setHover(item.id)}
                onMouseLeave={() => setHover(null)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
                  hover === item.id ? "bg-accent/70" : "hover:bg-accent/40",
                )}
              >
                <span className={cn("w-5 text-right text-xs tabular", top.has(item.id) ? "text-gold" : "text-muted-foreground")}>
                  {item.assessed ? i + 1 : "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{item.name}</span>
                    {item.alumnus && <span className="rounded bg-navy-500/40 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-ice">Alumni</span>}
                    {item.needsReview && <TriangleAlert className="size-3 shrink-0 text-warn" />}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {item.assessed ? (
                      <>
                        {(["trl", "brl", "oirl", "irl"] as const).map((k) => (
                          <span key={k} className="mr-2">
                            <span className="uppercase opacity-70">{k}</span> <span className={cn("font-semibold tabular", levelColor[k])}>{item.levels[k] ?? "–"}</span>
                          </span>
                        ))}
                      </>
                    ) : (
                      item.oneLiner
                    )}
                  </div>
                </div>
                {item.assessed ? (
                  <div className="w-16 text-right">
                    <div className={cn("text-lg font-bold leading-none tabular", top.has(item.id) ? "text-gradient-gold" : "text-foreground")}>
                      {item.promise?.toFixed(0)}
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-muted">
                      <div className={cn("h-1 rounded-full", top.has(item.id) ? "bg-gold" : "bg-tech")} style={{ width: `${item.promise ?? 0}%` }} />
                    </div>
                  </div>
                ) : (
                  <span className="rounded-md border border-dashed border-border px-2 py-1 text-[10px] text-muted-foreground transition group-hover:border-gold/50 group-hover:text-gold">
                    Assess
                  </span>
                )}
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function BlipCard({ item }: { item: RadarItem }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-foreground">{item.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {[item.country, item.stage && STAGE_LABELS[item.stage], item.sectors[0] && SECTORS[item.sectors[0]]].filter(Boolean).join(" · ")}
          </div>
        </div>
        {item.promise != null && <div className="text-xl font-bold text-gradient-gold tabular">{item.promise.toFixed(0)}</div>}
      </div>
      {item.assessed ? (
        <>
          <div className="grid grid-cols-4 gap-1 text-center">
            {(["trl", "brl", "oirl", "irl"] as const).map((k) => (
              <div key={k} className="rounded-md bg-muted/60 py-1">
                <div className="text-[9px] uppercase text-muted-foreground">{k}</div>
                <div className={cn("text-sm font-bold tabular", levelColor[k])}>{item.levels[k] ?? "–"}</div>
              </div>
            ))}
          </div>
          {item.headline && <p className="line-clamp-3 text-[11px] leading-snug text-ice/80">{item.headline}</p>}
          {item.topMatch && <div className="text-[11px] text-muted-foreground">Top investor: <span className="text-gold">{item.topMatch}</span></div>}
          {item.programme && <div className="text-[11px] text-muted-foreground">Programme: <span className="text-ice">{PROGRAMMES[item.programme]}</span></div>}
        </>
      ) : (
        <p className="text-[11px] text-muted-foreground">{item.oneLiner} — click to run the agent committee.</p>
      )}
    </div>
  );
}
