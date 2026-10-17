"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { IRL_DIMENSIONS, type IrlDimension } from "@/lib/taxonomy";

type Dims = Record<IrlDimension, { score: number | null; note: string }>;

export function IrlRadar({ dimensions }: { dimensions: Dims }) {
  const data = (Object.keys(IRL_DIMENSIONS) as IrlDimension[]).map((k) => ({
    dim: IRL_DIMENSIONS[k].replace("Marketing & distribution", "Go-to-market"),
    score: dimensions[k]?.score ?? 0,
    unknown: dimensions[k]?.score == null,
    note: dimensions[k]?.note ?? "",
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#cfdee8" strokeOpacity={0.12} />
          <PolarAngleAxis dataKey="dim" tick={{ fill: "#8fa6ba", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
          <Radar dataKey="score" stroke="#dfae32" strokeWidth={2} fill="#dfae32" fillOpacity={0.22} isAnimationActive />
          <Tooltip
            cursor={false}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
              if (!p) return null;
              return (
                <div className="max-w-64 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
                  <div className="font-semibold">
                    {p.dim}: <span className="text-gold">{p.unknown ? "no evidence" : `${p.score}/5`}</span>
                  </div>
                  <div className="mt-1 text-muted-foreground">{p.note}</div>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
