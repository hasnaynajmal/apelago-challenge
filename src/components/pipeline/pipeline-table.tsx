"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Quadrant } from "@/lib/quadrant";
import type { PipelineRow } from "@/lib/queries";
import { SECTORS } from "@/lib/taxonomy";
import { CountryLabel } from "@/components/country";
import { cn } from "@/lib/utils";
import { QUADRANTS } from "./quadrants";

const LEVELS = [
  { k: "trl", label: "Tech", cls: "text-tech" },
  { k: "brl", label: "Business", cls: "text-business" },
  { k: "oirl", label: "Impact", cls: "text-impact" },
  { k: "irl", label: "Invest", cls: "text-invest" },
] as const;

export function PipelineTable({ rows, lens, investorColumn = "Best investor match", initialFilter = "all" }: { rows: PipelineRow[]; lens: string; investorColumn?: string; initialFilter?: Quadrant | "all" }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Quadrant | "all">(initialFilter);
  const [query, setQuery] = useState("");
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) if (r.quadrant) c[r.quadrant] = (c[r.quadrant] ?? 0) + 1;
    return c;
  }, [rows]);
  const shown = rows.filter(
    (r) => (filter === "all" || r.quadrant === filter) && (!query || `${r.name} ${r.oneLiner ?? ""}`.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "invest", "accelerate", "refer", "monitor"] as const).map((q) => (
            <button
              key={q}
              onClick={() => setFilter(q)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                filter === q ? "border-navy bg-navy text-white" : "bg-white text-zinc-700 hover:border-zinc-300",
              )}
            >
              {q === "all" ? "All ventures" : QUADRANTS[q].label}
              <span className={cn("ml-1.5 tabular", filter === q ? "text-white/70" : "text-muted-foreground")}>{counts[q] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative md:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ventures" className="h-10 rounded-full pl-9" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead>
            <tr className="border-b text-sm text-muted-foreground">
              <th className="w-10 px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Venture</th>
              <th className="px-4 py-3 font-medium">Readiness</th>
              <th className="px-4 py-3 text-right font-medium">Score</th>
              <th className="px-4 py-3 font-medium">{investorColumn}</th>
              <th className="px-4 py-3 font-medium">Recommended next step</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {shown.map((r) => (
              <tr
                key={r.id}
                onClick={() => router.push(`/dashboard/startups/${r.id}?lens=${lens}`)}
                className="group cursor-pointer align-top transition-colors hover:bg-muted/50"
              >
                <td className="px-4 py-4 text-sm text-muted-foreground tabular">{rows.indexOf(r) + 1}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{r.name}</span>
                    {r.alumnus && <span title="A'Pelago accelerator alumni" className="whitespace-nowrap rounded-full bg-navy-soft px-2 py-0.5 text-xs font-medium text-navy">Alumni</span>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                    {r.sectors[0] && <span>{SECTORS[r.sectors[0]]}</span>}
                    {r.country && <CountryLabel code={r.country} />}
                  </div>
                  {r.quadrant && (
                    <span className={cn("mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", QUADRANTS[r.quadrant].badge)}>
                      {QUADRANTS[r.quadrant].label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="grid grid-cols-4 gap-3">
                    {LEVELS.map((l) => (
                      <div key={l.k} className="text-center">
                        <div className={cn("text-sm font-semibold tabular", l.cls)}>{r.levels[l.k] ?? "–"}</div>
                        <div className="text-xs text-muted-foreground">{l.label}</div>
                      </div>
                    ))}
                  </div>
                  {r.needsReview && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-700"><TriangleAlert className="size-3.5" /> Needs review</div>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-lg font-semibold tabular">{r.promise != null ? Math.round(r.promise) : "–"}</span>
                </td>
                <td className="px-4 py-4">
                  {r.topInvestor ? (
                    <>
                      <div className="text-sm font-medium">{r.topInvestor.name.replace(/\s*\(.*\)$/, "")}</div>
                      <div className="text-sm text-muted-foreground">{Math.round(r.topInvestor.fit * 100)}% fit</div>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="max-w-80 px-4 py-4">
                  {r.nextStep ? (
                    <>
                      <div className="text-sm leading-snug">{r.nextStep.title}</div>
                      <div className="text-sm text-muted-foreground">{r.nextStep.owner === "operator" ? "Your team" : "Startup"}</div>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not assessed yet</span>
                  )}
                </td>
                <td className="px-2 py-4">
                  <ChevronRight className="size-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500" />
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No ventures match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
