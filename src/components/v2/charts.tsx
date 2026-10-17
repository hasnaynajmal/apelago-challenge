"use client";

// Overview charts (Recharts, client-only so SVG coordinates never mismatch between server and browser).
import Link from "next/link";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { QUADRANTS } from "@/components/pipeline/quadrants";
import type { Quadrant } from "@/lib/quadrant";

const ORDER: Quadrant[] = ["invest", "accelerate", "refer", "monitor"];

/** Donut of the four portfolio groups with a clickable legend. */
export function PipelineDonut({ counts, lens }: { counts: Record<Quadrant, number>; lens: string }) {
  const total = ORDER.reduce((n, q) => n + counts[q], 0);
  const data = ORDER.filter((q) => counts[q] > 0).map((q) => ({ q, name: QUADRANTS[q].label, value: counts[q] }));
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-[150px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={52} outerRadius={72} paddingAngle={3} cornerRadius={6} stroke="none" isAnimationActive={false}>
              {data.map((d) => <Cell key={d.q} fill={QUADRANTS[d.q].dot} />)}
            </Pie>
            <Tooltip
              cursor={false}
              contentStyle={{ borderRadius: 10, border: "1px solid #e7eaef", fontSize: 12, padding: "6px 10px" }}
              formatter={(v, n) => [`${v} ventures`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-semibold leading-none tabular">{total}</span>
          <span className="mt-1 text-[11px] text-muted-foreground">ventures</span>
        </div>
      </div>
      <ul className="grid w-full min-w-0 grid-cols-2 gap-x-2 gap-y-0.5">
        {ORDER.map((q) => (
          <li key={q}>
            <Link href={`/dashboard/ventures?lens=${lens}&group=${q}`} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-50">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: QUADRANTS[q].dot }} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-700 group-hover:text-foreground">{QUADRANTS[q].label}</span>
              <span className="text-[13px] font-semibold tabular">{counts[q]}</span>
              
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** How scores are spread across the portfolio, in 10-point buckets. */
export function ScoreHistogram({ scores }: { scores: number[] }) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}`, label: `${i * 10}–${i * 10 + 9}`, n: 0 }));
  for (const s of scores) buckets[Math.min(9, Math.floor(s / 10))].n++;
  const first = buckets.findIndex((b) => b.n > 0);
  const last = 9 - [...buckets].reverse().findIndex((b) => b.n > 0);
  const data = first < 0 ? [] : buckets.slice(Math.max(0, first - 1), Math.min(10, last + 2));
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="h-[214px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
          <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#98a2b3" }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#98a2b3" }} width={36} />
          <Tooltip
            cursor={{ fill: "#f2f4f7", radius: 8 }}
            contentStyle={{ borderRadius: 10, border: "1px solid #e7eaef", fontSize: 12, padding: "6px 10px" }}
            labelFormatter={(_, p) => `Score ${p?.[0]?.payload?.label ?? ""}`}
            formatter={(v) => [`${v} ventures`, ""]}
          />
          <Bar dataKey="n" radius={[8, 8, 8, 8]} maxBarSize={34} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.range} fill={d.n === max ? "#002444" : "#c7d4e2"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
