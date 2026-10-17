import Link from "next/link";
import { Suspense } from "react";
import { Flag } from "@/components/country";
import { PageHeader } from "@/components/v2/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { INVESTOR_FRAMING, resolveLens } from "@/lib/lens";
import { getInvestorDemand } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function InvestorsPage({ searchParams }: PageProps<"/dashboard/investors">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[600px] max-w-[1100px] rounded-2xl" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/investors">["searchParams"] }) {
  const lens = resolveLens((await searchParams).lens);
  const framing = INVESTOR_FRAMING[lens];
  const investors = await getInvestorDemand(lens, 20);
  const max = investors[0]?.ventures.length || 1;
  const at = (id: string) => `/dashboard/startups/${id}?lens=${lens}`;

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <PageHeader title={framing.ownerId ? "Co-investors" : "Investors"} sub={`${framing.sub} Ranked by how many ventures they are a top-3 match for.`} />

      {/* Podium: the three most-matched investors */}
      <div className="grid gap-4 sm:grid-cols-3">
        {investors.slice(0, 3).map((inv, i) => (
          <div key={inv.id} className={cn("card-surface p-5", i === 0 && "ring-1 ring-gold/50")}>
            <div className="flex items-center justify-between">
              <span className={cn("flex size-8 items-center justify-center rounded-full text-sm font-semibold", i === 0 ? "bg-gold text-navy" : "bg-zinc-100 text-zinc-600")}>{i + 1}</span>
              {inv.isPartner && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-medium text-gold-ink">Challenge partner</span>}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Flag code={inv.hq} />
              <span className="truncate text-[15px] font-semibold">{inv.name}</span>
            </div>
            <div className="mt-1 text-[13px] text-muted-foreground"><span className="text-2xl font-semibold text-foreground tabular">{inv.ventures.length}</span> ventures matched</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {inv.ventures.slice(0, 4).map((v) => (
                <Link key={v.id} href={at(v.id)} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700 hover:bg-navy-soft hover:text-navy">{v.name}</Link>
              ))}
              {inv.ventures.length > 4 && <span className="px-1 text-xs text-muted-foreground">+{inv.ventures.length - 4}</span>}
            </div>
          </div>
        ))}
      </div>

      <section className="card-surface overflow-hidden">
        <div className="px-5 pb-3 pt-5">
          <h2 className="text-[15px] font-semibold">{framing.demand}</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{framing.demandSub}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] md:min-w-[720px]">
            <thead>
              <tr className="border-y bg-zinc-50/70 text-xs text-muted-foreground">
                <th className="w-14 py-2.5 pl-5 font-medium">#</th>
                <th className="py-2.5 pr-3 font-medium">Investor</th>
                <th className="px-3 py-2.5 font-medium">Matched ventures</th>
                <th className="hidden px-5 py-2.5 font-medium md:table-cell">Top matches</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {investors.map((inv, i) => (
                <tr key={inv.id} className="transition-colors hover:bg-zinc-50/70">
                  <td className="py-3.5 pl-5 text-xs text-muted-foreground tabular">{String(i + 1).padStart(2, "0")}</td>
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-2">
                      <Flag code={inv.hq} />
                      <span className="font-semibold">{inv.name}</span>
                      {inv.isPartner && <span className="rounded-full bg-gold-soft px-2 py-px text-[11px] font-medium text-gold-ink">Partner</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 font-semibold tabular">{inv.ventures.length}</span>
                      <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-zinc-100 sm:block">
                        <span className="block h-full rounded-full bg-navy" style={{ width: `${(inv.ventures.length / max) * 100}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {inv.ventures.slice(0, 3).map((v) => (
                        <Link key={v.id} href={at(v.id)} className="rounded-md border bg-white px-1.5 py-0.5 text-xs text-zinc-700 hover:border-navy hover:text-navy">{v.name}</Link>
                      ))}
                      {inv.ventures.length > 3 && <span className="px-1 py-0.5 text-xs text-muted-foreground">+{inv.ventures.length - 3}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
