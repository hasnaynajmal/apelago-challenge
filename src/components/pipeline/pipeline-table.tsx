"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, TriangleAlert } from "lucide-react";
import type { Quadrant } from "@/lib/quadrant";
import type { PipelineRow } from "@/lib/queries";
import { SECTORS } from "@/lib/taxonomy";
import { CountryLabel, Flag } from "@/components/country";
import { GroupPill, LevelDashes, VentureAvatar } from "@/components/v2/primitives";
import { cn } from "@/lib/utils";
import { QUADRANTS } from "./quadrants";

const LEVELS = [
  { k: "trl", label: "Tech", cls: "text-tech" },
  { k: "brl", label: "Business", cls: "text-business" },
  { k: "oirl", label: "Impact", cls: "text-impact" },
  { k: "irl", label: "Invest", cls: "text-invest" },
] as const;

const FILTERS = ["all", "invest", "accelerate", "refer", "monitor"] as const;
const cleanName = (n: string) => n.replace(/\s*\(.*\)$/, "");

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
  const open = (id: string) => router.push(`/dashboard/startups/${id}?lens=${lens}`);

  return (
    <div className="card-surface overflow-hidden">
      {/* Toolbar: segmented group filter + search */}
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="no-scrollbar -mx-1 flex overflow-x-auto px-1">
          <div className="inline-flex rounded-xl bg-zinc-100/80 p-1">
            {FILTERS.map((q) => (
              <button
                key={q}
                onClick={() => setFilter(q)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] transition-all",
                  filter === q ? "bg-white font-medium text-foreground shadow-[0_1px_3px_rgb(16_24_40/0.1)]" : "text-zinc-600 hover:text-foreground",
                )}
              >
                {q !== "all" && <span className="size-1.5 rounded-full" style={{ background: QUADRANTS[q].dot }} />}
                {q === "all" ? "All" : QUADRANTS[q].label}
                <span className={cn("tabular", filter === q ? "text-muted-foreground" : "text-zinc-400")}>{counts[q] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="relative md:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ventures"
            className="h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-zinc-300"
          />
        </div>
      </div>

      {/* Phones: a compact list (the full table needs ~960px). */}
      <ul className="divide-y border-t md:hidden">
        {shown.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => open(r.id)} className="flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-muted/60">
              <VentureAvatar name={r.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{r.name}</span>
                  {r.alumnus && <span className="shrink-0 rounded-full bg-navy-soft px-1.5 py-px text-[10px] font-medium text-navy">Alumni</span>}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {r.sectors[0] && <span>{SECTORS[r.sectors[0]]}</span>}
                  {r.country && <CountryLabel code={r.country} />}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                  <GroupPill quadrant={r.quadrant} className="py-px text-[11px]" />
                  {LEVELS.map((l) => (
                    <span key={l.k}>{l.label} <b className={cn("font-semibold tabular", l.cls)}>{r.levels[l.k] ?? "–"}</b></span>
                  ))}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-lg font-semibold leading-none tabular">{r.promise != null ? Math.round(r.promise) : "–"}</span>
                <span className="text-[10px] text-muted-foreground">score</span>
              </span>
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">No ventures match.</li>}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] text-left text-[13px]">
          <thead>
            <tr className="border-y bg-zinc-50/70 text-xs text-muted-foreground">
              <th className="w-12 py-3 pl-5 font-medium">#</th>
              <th className="py-3 pr-3 font-medium">Venture</th>
              <th className="px-3 py-3 font-medium">Group</th>
              <th className="px-3 py-3 font-medium">Readiness</th>
              <th className="px-3 py-3 font-medium">Score</th>
              <th className="px-3 py-3 font-medium">{investorColumn}</th>
              <th className="px-3 py-3 font-medium">Next step</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {shown.map((r) => (
              <tr key={r.id} onClick={() => open(r.id)} className="group cursor-pointer transition-colors hover:bg-zinc-50/80">
                <td className="py-3.5 pl-5 text-xs text-muted-foreground tabular">{String(rows.indexOf(r) + 1).padStart(2, "0")}</td>
                <td className="py-3.5 pr-3">
                  <div className="flex items-center gap-3">
                    <VentureAvatar name={r.name} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-foreground group-hover:text-navy">{r.name}</span>
                        {r.alumnus && <span title="A'Pelago accelerator alumni" className="rounded-full bg-navy-soft px-1.5 text-[10px] font-medium text-navy">Alumni</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Flag code={r.country} className="h-3" />
                        <span className="truncate">{r.sectors[0] ? SECTORS[r.sectors[0]] : ""}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5"><GroupPill quadrant={r.quadrant} /></td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-2">
                    <LevelDashes levels={r.levels} />
                    {r.needsReview && <span title="Second Opinion disagrees on a level — check it"><TriangleAlert className="size-3.5 text-amber-600" /></span>}
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  {r.promise != null ? (
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 text-[15px] font-semibold tabular">{Math.round(r.promise)}</span>
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                        <span className="block h-full rounded-full bg-navy" style={{ width: `${Math.round(r.promise)}%` }} />
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="max-w-48 px-3 py-3.5">
                  {r.topInvestor ? (
                    <>
                      <div className="truncate font-medium text-zinc-800">{cleanName(r.topInvestor.name)}</div>
                      <div className="text-xs text-muted-foreground">{Math.round(r.topInvestor.fit * 100)}% fit</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="max-w-72 px-3 py-3.5">
                  {r.nextStep ? (
                    <>
                      <div className="line-clamp-1 text-zinc-800">{r.nextStep.title}</div>
                      <div className="text-xs text-muted-foreground">{r.nextStep.owner === "operator" ? "Your team" : "Startup"}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not assessed yet</span>
                  )}
                </td>
                <td className="pr-4">
                  <ChevronRight className="size-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500" />
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No ventures match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
