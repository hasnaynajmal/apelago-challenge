import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { DeadlinesPanel, InvestorDemandPanel } from "@/components/pipeline/deadlines-panel";
import { PortfolioMatrix } from "@/components/pipeline/portfolio-matrix";
import { QUADRANTS } from "@/components/pipeline/quadrants";
import { Skeleton } from "@/components/ui/skeleton";
import { INVESTOR_FRAMING, LENSES, resolveLens } from "@/lib/lens";
import type { Quadrant } from "@/lib/quadrant";
import { getDeadlines, getInvestorDemand, getPipeline } from "@/lib/queries";

export default function Overview({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  await connection();
  const lens = resolveLens((await searchParams).lens);
  const lensInfo = LENSES.find((l) => l.id === lens)!;
  const framing = INVESTOR_FRAMING[lens];
  const [rows, deadlines, demand] = await Promise.all([getPipeline(lens), getDeadlines(lens), getInvestorDemand(lens)]);
  const count = (q: Quadrant) => rows.filter((r) => r.quadrant === q).length;

  const kpis = [
    { label: "Ventures assessed", value: rows.filter((r) => r.assessed).length, sub: `of ${rows.length} in the pipeline` },
    { label: QUADRANTS.invest.label, value: count("invest"), sub: "ready for investor intros", dot: QUADRANTS.invest.dot },
    { label: QUADRANTS.accelerate.label, value: count("accelerate"), sub: "programme candidates", dot: QUADRANTS.accelerate.dot },
    { label: "Deadlines in 60 days", value: deadlines.filter((d) => d.days <= 60).length, sub: deadlines[0] ? `next: ${deadlines[0].name.split(" – ")[0]}` : "none" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Overview</h1>
        <p className="mt-1.5 text-muted-foreground">
          The portfolio through the <span className="font-medium text-foreground">{lensInfo.label}</span> thesis. Click any venture for its full assessment.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card-surface p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {k.dot && <span className="size-2 rounded-full" style={{ background: k.dot }} />}
              {k.label}
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight tabular">{k.value}</div>
            <div className="mt-1 truncate text-sm text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-semibold">Readiness vs thesis fit</h2>
            <Link href={`/dashboard/ventures?lens=${lens}`} className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline">
              All ventures <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <PortfolioMatrix rows={rows} lens={lens} />
          <div className="grid gap-3 sm:grid-cols-2">
            {(["invest", "accelerate", "refer", "monitor"] as const).map((q) => (
              <div key={q} className="card-surface flex gap-3 p-4">
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: QUADRANTS[q].dot }} />
                <div>
                  <div className="text-[15px] font-semibold">{QUADRANTS[q].label} <span className="font-normal text-muted-foreground tabular">· {count(q)}</span></div>
                  <div className="text-sm text-muted-foreground">{QUADRANTS[q].hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <DeadlinesPanel deadlines={deadlines.slice(0, 3)} lens={lens} />
          <InvestorDemandPanel investors={demand} lens={lens} title={framing.demand} sub={framing.demandSub} />
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-16 w-80 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      <Skeleton className="h-[520px] rounded-2xl" />
    </div>
  );
}
