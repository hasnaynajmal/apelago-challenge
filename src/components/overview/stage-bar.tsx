import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { QUADRANTS } from "@/components/pipeline/quadrants";
import type { Quadrant } from "@/lib/quadrant";

const ORDER: Quadrant[] = ["invest", "accelerate", "refer", "monitor"];
const SHORT: Record<Quadrant, string> = {
  invest: "Fits the thesis, ready for a round",
  accelerate: "Fits the thesis, still early",
  refer: "Mature, but outside this thesis",
  monitor: "Early and off-thesis",
};
const PLAIN: Record<Quadrant, string> = {
  invest: "ready for investment",
  accelerate: "to accelerate",
  refer: "to refer onwards",
  monitor: "to monitor",
};

/** One bar that splits the pipeline into the four groups. Each segment links to the filtered venture list. */
export function StageBar({ counts, total, lens }: { counts: Record<Quadrant, number>; total: number; lens: string }) {
  const groups = ORDER.filter((q) => counts[q] > 0);
  return (
    <div className="card-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Where the pipeline stands</h2>
        <span className="text-sm text-muted-foreground">{total} ventures</span>
      </div>

      <div className="mt-4 flex h-11 gap-1 overflow-hidden rounded-xl">
        {groups.map((q) => (
          <Link
            key={q}
            href={`/dashboard/ventures?lens=${lens}&group=${q}`}
            className="group relative flex min-w-[52px] items-center justify-center text-sm font-semibold text-white transition-[filter] hover:brightness-110"
            style={{ flexGrow: counts[q], flexBasis: 0, background: QUADRANTS[q].dot }}
            title={`${counts[q]} ${PLAIN[q]} — ${QUADRANTS[q].hint}`}
          >
            <span className="tabular">{counts[q]}</span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
        {ORDER.map((q) => (
          <Link key={q} href={`/dashboard/ventures?lens=${lens}&group=${q}`} className="group flex gap-2.5">
            <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: QUADRANTS[q].dot }} />
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-sm font-medium">
                <span className="tabular">{counts[q]}</span> {PLAIN[q]}
                <ChevronRight className="size-3.5 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500" />
              </span>
              <span className="block truncate text-xs text-muted-foreground" title={QUADRANTS[q].hint}>{SHORT[q]}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
