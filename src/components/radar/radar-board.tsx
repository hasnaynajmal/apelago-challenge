"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, TriangleAlert } from "lucide-react";
import { SECTORS, STAGE_LABELS, type Sector } from "@/lib/taxonomy";
import { PROGRAMMES } from "@/lib/lens";
import type { RadarItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

const SIZE = 900;
const C = SIZE / 2;
const R = 300;
// Crop the viewBox to the circle plus label margin (labels sit left/right, so trim top/bottom).
const VB_Y = C - R - 45;
const VB_H = 2 * R + 90;
const SHORT: Record<Sector, string> = {
  aquaculture_fisheries: "Aquaculture", blue_biotech: "Blue biotech", blue_energy: "Blue energy", ocean_observation: "Ocean data",
  shipping_ports: "Shipping & ports", water_management: "Water", pollution_cleanup: "Pollution cleanup", restoration_blue_carbon: "Restoration",
  coastal_tourism: "Coastal tourism", circular_materials: "Circular materials", seafood_alt_protein: "Seafood & protein", climate_software: "Climate software",
};
// Round SVG coordinates so server and client render identical markup (avoids hydration mismatch).
const q = (n: number) => Math.round(n * 100) / 100;
const SECTOR_IDS = Object.keys(SECTORS) as Sector[];
const WEDGE = (2 * Math.PI) / SECTOR_IDS.length;
const RINGS = [0.3, 0.55, 0.78, 1];
const RING_LABEL = ["Hot", "Warm", "Watch", "Early"];

const NAVY = "#002444";
const GOLD = "#dfae32";

function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

function place(item: RadarItem, min: number, max: number) {
  const sector = SECTOR_IDS.indexOf(item.sectors[0] ?? "climate_software");
  const angle = -Math.PI / 2 + sector * WEDGE + (0.2 + 0.6 * hash01(item.id)) * WEDGE;
  // Radius is relative to the spread of promise scores in this lens, so the field uses the whole radar.
  const rel = item.promise == null ? 1 : max > min ? (item.promise - min) / (max - min) : 0.5;
  const radius = item.promise == null ? 0.94 : 0.14 + 0.76 * (1 - rel);
  return { x: q(C + Math.cos(angle) * radius * R), y: q(C + Math.sin(angle) * radius * R) };
}

export const LEVEL_TONE = { trl: "text-tech", brl: "text-business", oirl: "text-impact", irl: "text-invest" } as const;

export function RadarBoard({ items, lens }: { items: RadarItem[]; lens: string }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const assessed = items.filter((i) => i.assessed);
  const top = new Set(assessed.slice(0, 3).map((i) => i.id));
  const placed = useMemo(() => {
    const ps = items.filter((i) => i.promise != null).map((i) => i.promise as number);
    const min = Math.min(...ps);
    const max = Math.max(...ps);
    return items.map((i) => ({ item: i, ...place(i, min, max) }));
  }, [items]);
  const hovered = placed.find((p) => p.item.id === hover);
  const href = (id: string) => `/startups/${id}?lens=${lens}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
      {/* Radar */}
      <div className="card-surface relative p-6">
        <div className="relative mx-auto w-full max-w-[760px]" style={{ aspectRatio: `${SIZE} / ${VB_H}` }}>
          <svg viewBox={`0 ${VB_Y} ${SIZE} ${VB_H}`} className="h-full w-full" role="img" aria-label="Opportunity radar">
            <defs>
              <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={NAVY} stopOpacity="0" />
                <stop offset="100%" stopColor={NAVY} stopOpacity="0.07" />
              </linearGradient>
            </defs>
            <circle cx={C} cy={C} r={R} fill="#fafafa" />
            {RINGS.map((at, i) => (
              <g key={at}>
                <circle cx={C} cy={C} r={at * R} fill="none" stroke="#e4e4e7" strokeDasharray={i === RINGS.length - 1 ? undefined : "3 5"} />
                <text x={C + 8} y={C - at * R + 20} fill="#a1a1aa" fontSize={14}>{RING_LABEL[i]}</text>
              </g>
            ))}
            {SECTOR_IDS.map((s, i) => {
              const a = -Math.PI / 2 + i * WEDGE;
              const mid = a + WEDGE / 2;
              const cos = Math.cos(mid);
              return (
                <g key={s}>
                  <line x1={C} y1={C} x2={q(C + Math.cos(a) * R)} y2={q(C + Math.sin(a) * R)} stroke="#ededf0" />
                  <text
                    x={q(C + cos * (R + 18))} y={q(C + Math.sin(mid) * (R + 18))}
                    fill="#52525b" fontSize={16} dominantBaseline="middle"
                    textAnchor={cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle"}
                  >
                    {SHORT[s]}
                  </text>
                </g>
              );
            })}
            <g className="radar-sweep" style={{ transformOrigin: `${C}px ${C}px` }}>
              <path d={`M ${C} ${C} L ${C + R} ${C} A ${R} ${R} 0 0 0 ${q(C + Math.cos(-0.6) * R)} ${q(C + Math.sin(-0.6) * R)} Z`} fill="url(#sweep)" />
              <line x1={C} y1={C} x2={C + R} y2={C} stroke={NAVY} strokeOpacity={0.18} />
            </g>
            <circle cx={C} cy={C} r={3.5} fill={NAVY} />

            {placed.map(({ item, x, y }, idx) => {
              const isTop = top.has(item.id);
              const isHover = hover === item.id;
              const rank = isTop ? assessed.findIndex((a) => a.id === item.id) + 1 : 0;
              const r = isTop ? 16 : item.assessed ? 5.5 + (item.levels.oirl ?? 3) * 0.9 : 5;
              const fill = isTop ? GOLD : NAVY;
              return (
                <motion.g
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1, x, y }}
                  transition={{ delay: idx * 0.02, type: "spring", stiffness: 150, damping: 22 }}
                  onMouseEnter={() => setHover(item.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => router.push(href(item.id))}
                  className="cursor-pointer"
                >
                  {isTop && <circle r={r} fill={GOLD} className="blip-pulse" />}
                  {item.needsReview && <circle r={r + 4} fill="none" stroke="#d97706" strokeWidth={1.3} strokeDasharray="2 2" />}
                  <circle
                    r={isHover ? r + 2 : r}
                    fill={item.assessed ? fill : "#fff"}
                    fillOpacity={item.assessed ? (isTop ? 1 : 0.85) : 1}
                    stroke={item.assessed ? "#fff" : "#a1a1aa"}
                    strokeWidth={item.assessed ? 2 : 1.4}
                    strokeDasharray={item.assessed ? undefined : "2 2"}
                    style={{ transition: "r 0.15s" }}
                  />
                  {isTop && (
                    <text textAnchor="middle" y={6} fill="#002444" fontSize={17} fontWeight={700} style={{ pointerEvents: "none" }}>{rank}</text>
                  )}
                  {isHover && (
                    <text x={r + 7} y={4.5} fill="#0a0a0b" fontSize={16} fontWeight={600} paintOrder="stroke" stroke="#fff" strokeWidth={4}>
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
                className="pointer-events-none absolute z-10 w-72 rounded-xl border bg-white p-4 shadow-xl"
                style={{
                  left: `${(hovered.x / SIZE) * 100}%`,
                  top: `${((hovered.y - VB_Y) / VB_H) * 100}%`,
                  transform: `translate(${hovered.x > C ? "-105%" : "14px"}, ${hovered.y > C ? "-105%" : "14px"})`,
                }}
              >
                <BlipCard item={hovered.item} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Legend dot="bg-gold" label="Top 3" />
          <Legend dot="bg-navy" label="Assessed" />
          <Legend dot="border border-dashed border-zinc-400 bg-white" label="Not yet assessed" />
          <Legend dot="border border-dashed border-warn bg-white" label="Needs review" />
          <span>Centre = most promising · size = ocean impact</span>
        </div>
      </div>

      {/* Ranking */}
      <div id="ranking" className="card-surface flex max-h-[790px] flex-col overflow-hidden">
        <div className="flex items-baseline justify-between border-b px-5 py-4">
          <h3 className="text-base font-semibold">Ranking</h3>
          <span className="text-sm text-muted-foreground">{assessed.length} assessed</span>
        </div>
        <ol className="flex-1 divide-y overflow-y-auto">
          {items.map((item, i) => (
            <li key={item.id}>
              <Link
                href={href(item.id)}
                onMouseEnter={() => setHover(item.id)}
                onMouseLeave={() => setHover(null)}
                className={cn("group flex items-center gap-4 px-5 py-3.5 transition-colors", hover === item.id ? "bg-muted/70" : "hover:bg-muted/50")}
              >
                <span className={cn("w-5 text-right text-sm tabular", top.has(item.id) ? "font-semibold text-gold-ink" : "text-muted-foreground")}>
                  {item.assessed ? i + 1 : "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium">{item.name}</span>
                    {item.alumnus && <span className="rounded-full bg-navy-soft px-2 py-0.5 text-xs font-medium text-navy">Alumni</span>}
                    {item.needsReview && <TriangleAlert className="size-3.5 shrink-0 text-warn" />}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-muted-foreground">
                    {item.assessed
                      ? (["trl", "brl", "oirl", "irl"] as const).map((k) => (
                          <span key={k} className="mr-3">
                            {k.toUpperCase()} <span className={cn("font-semibold tabular", LEVEL_TONE[k])}>{item.levels[k] ?? "–"}</span>
                          </span>
                        ))
                      : item.oneLiner}
                  </div>
                </div>
                {item.assessed ? (
                  <span className={cn("text-xl font-semibold tabular", top.has(item.id) ? "text-gold-ink" : "text-foreground")}>
                    {item.promise?.toFixed(0)}
                  </span>
                ) : (
                  <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground group-hover:border-navy group-hover:text-navy">Assess</span>
                )}
                <ChevronRight className="size-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-2.5 rounded-full", dot)} /> {label}
    </span>
  );
}

function BlipCard({ item }: { item: RadarItem }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold">{item.name}</div>
          <div className="text-sm text-muted-foreground">
            {[item.country, item.stage && STAGE_LABELS[item.stage], item.sectors[0] && SECTORS[item.sectors[0]]].filter(Boolean).join(" · ")}
          </div>
        </div>
        {item.promise != null && <div className="text-2xl font-semibold tabular">{item.promise.toFixed(0)}</div>}
      </div>
      {item.assessed ? (
        <>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {(["trl", "brl", "oirl", "irl"] as const).map((k) => (
              <div key={k} className="rounded-lg bg-muted py-1.5">
                <div className="text-[11px] font-medium text-muted-foreground">{k.toUpperCase()}</div>
                <div className={cn("text-base font-semibold tabular", LEVEL_TONE[k])}>{item.levels[k] ?? "–"}</div>
              </div>
            ))}
          </div>
          {item.headline && <p className="line-clamp-3 text-sm leading-snug text-zinc-600">{item.headline}</p>}
          {item.topMatch && <div className="text-sm text-muted-foreground">Top investor: <span className="font-medium text-foreground">{item.topMatch}</span></div>}
          {item.programme && <div className="text-sm text-muted-foreground">Programme: <span className="font-medium text-foreground">{PROGRAMMES[item.programme]}</span></div>}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{item.oneLiner} — click to run the committee.</p>
      )}
    </div>
  );
}
