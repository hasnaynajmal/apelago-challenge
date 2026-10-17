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
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="#e4e4e7" />
          <PolarAngleAxis dataKey="dim" tick={{ fill: "#52525b", fontSize: 13 }} />
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
          <Radar dataKey="score" stroke="#002444" strokeWidth={2} fill="#002444" fillOpacity={0.14} isAnimationActive={false} dot={{ r: 3, fill: "#002444" }} />
          <Tooltip
            cursor={false}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
              if (!p) return null;
              return (
                <div className="max-w-72 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg">
                  <div className="font-medium">
                    {p.dim}: <span className="text-navy">{p.unknown ? "no evidence" : `${p.score} / 5`}</span>
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
