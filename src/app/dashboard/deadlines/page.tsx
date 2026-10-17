import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CalendarClock, Hourglass, Users } from "lucide-react";
import { PageHeader } from "@/components/v2/page-header";
import { StatCard } from "@/components/v2/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveLens } from "@/lib/lens";
import { getDeadlines, type DeadlineRow } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function DeadlinesPage({ searchParams }: PageProps<"/dashboard/deadlines">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[600px] max-w-[1100px] rounded-2xl" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

const eur = (n: number | null) => (n == null ? null : n >= 1_000_000 ? `€${+(n / 1_000_000).toFixed(1)}M` : `€${Math.round(n / 1000)}k`);

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/deadlines">["searchParams"] }) {
  await connection();
  const lens = resolveLens((await searchParams).lens);
  const deadlines = await getDeadlines(lens, 365);
  const soon = deadlines.filter((d) => d.days <= 30).length;
  const eligible = new Set(deadlines.flatMap((d) => d.eligible.map((e) => e.id))).size;

  // Group calls by month for a schedule-style timeline.
  const months = new Map<string, DeadlineRow[]>();
  for (const d of deadlines) {
    const key = new Date(d.date).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
    months.set(key, [...(months.get(key) ?? []), d]);
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <PageHeader title="Deadlines" sub="Funding calls with a fixed deadline in the next 12 months, and which ventures should apply." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={CalendarClock} tint="sky" value={deadlines.length} label="Calls in the next 12 months" hint="Rolling programmes are listed on each venture" />
        <StatCard icon={Hourglass} tint="amber" value={soon} label="Closing in 30 days" hint={soon ? "Prepare applications now" : "Nothing urgent"} />
        <StatCard icon={Users} tint="emerald" value={eligible} label="Ventures eligible" hint="For at least one call" className="col-span-2 lg:col-span-1" />
      </div>

      <div className="card-surface p-5 sm:p-6">
        {deadlines.length === 0 && <p className="py-8 text-center text-muted-foreground">No deadlines in the next 12 months.</p>}
        <div className="space-y-8">
          {[...months.entries()].map(([month, rows]) => (
            <section key={month}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">{month}</h2>
              <ol className="relative space-y-3 border-l border-dashed border-zinc-200 pl-6">
                {rows.map((d) => {
                  const date = new Date(d.date);
                  const urgent = d.days <= 30;
                  const near = d.days <= 60;
                  return (
                    <li key={d.id} className="relative">
                      <span className={cn("absolute -left-[31px] top-5 size-2.5 rounded-full ring-4 ring-white", urgent ? "bg-amber-500" : near ? "bg-sky-500" : "bg-zinc-300")} />
                      <div className={cn("rounded-2xl border p-4 sm:flex sm:items-start sm:gap-4", urgent ? "border-amber-200 bg-amber-50/60" : near ? "border-sky-100 bg-sky-50/50" : "bg-zinc-50/50")}>
                        <div className="mb-3 flex w-14 shrink-0 flex-col items-center rounded-xl bg-white py-1.5 shadow-[0_1px_2px_rgb(16_24_40/0.06)] sm:mb-0">
                          <span className="text-lg font-semibold leading-none tabular">{date.getUTCDate()}</span>
                          <span className="mt-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[15px] font-semibold leading-snug">{d.name}</div>
                              <div className="mt-0.5 text-[13px] text-muted-foreground">
                                {d.provider}
                                {d.amount ? ` · up to ${eur(d.amount)}` : ""}
                              </div>
                            </div>
                            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", urgent ? "bg-amber-100 text-amber-800" : near ? "bg-sky-100 text-sky-800" : "bg-zinc-100 text-zinc-600")}>
                              {d.days} days left
                            </span>
                          </div>
                          {d.eligible.length > 0 && (
                            <div className="mt-3">
                              <div className="mb-1.5 text-xs text-muted-foreground">{d.eligible.length} ventures fit</div>
                              <div className="flex flex-wrap gap-1.5">
                                {d.eligible.slice(0, 8).map((e) => (
                                  <Link key={e.id} href={`/dashboard/startups/${e.id}?lens=${lens}`} className="rounded-lg border bg-white px-2 py-0.5 text-[13px] text-zinc-700 transition-colors hover:border-navy hover:text-navy">
                                    {e.name}
                                  </Link>
                                ))}
                                {d.eligible.length > 8 && <span className="px-1 py-0.5 text-[13px] text-muted-foreground">+{d.eligible.length - 8} more</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
