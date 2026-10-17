import Link from "next/link";
import type { DeadlineRow } from "@/lib/queries";
import { cn } from "@/lib/utils";

const eur = (n: number | null) => (n == null ? null : n >= 1_000_000 ? `€${+(n / 1_000_000).toFixed(1)}M` : `€${Math.round(n / 1000)}k`);

export function DeadlinesPanel({ deadlines, lens }: { deadlines: DeadlineRow[]; lens: string }) {
  return (
    <div className="card-surface flex h-full flex-col">
      <div className="border-b px-5 py-4">
        <h3 className="text-base font-semibold">Upcoming deadlines</h3>
        <p className="text-sm text-muted-foreground">Funding calls in the next 4 months and which ventures fit</p>
      </div>
      <ul className="flex-1 divide-y">
        {deadlines.map((d) => {
          const date = new Date(d.date);
          return (
            <li key={d.id} className="flex gap-4 px-5 py-4">
              <div className={cn("flex w-14 shrink-0 flex-col items-center rounded-xl border py-2", d.days <= 30 && "border-amber-300 bg-amber-50")}>
                <span className="text-xl font-semibold leading-none tabular">{date.getUTCDate()}</span>
                <span className="mt-1 text-xs uppercase text-muted-foreground">{date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold leading-snug">{d.name}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {d.days} days left{d.amount ? ` · up to ${eur(d.amount)}` : ""}
                </div>
                <div className="mt-2 text-sm">
                  {d.eligible.length ? (
                    <>
                      <span className="font-medium">{d.eligible.length} venture{d.eligible.length === 1 ? "" : "s"} fit: </span>
                      {d.eligible.slice(0, 4).map((e, i) => (
                        <span key={e.id}>
                          <Link href={`/startups/${e.id}?lens=${lens}`} className="text-navy hover:underline">{e.name}</Link>
                          {i < Math.min(4, d.eligible.length) - 1 ? ", " : ""}
                        </span>
                      ))}
                      {d.eligible.length > 4 && <span className="text-muted-foreground"> +{d.eligible.length - 4}</span>}
                    </>
                  ) : (
                    <span className="text-muted-foreground">No matching ventures yet</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {deadlines.length === 0 && <li className="px-5 py-8 text-muted-foreground">No deadlines in the next 4 months.</li>}
      </ul>
    </div>
  );
}
