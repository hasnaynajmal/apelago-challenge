import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { StageBar } from "@/components/overview/stage-bar";
import { TopPicks } from "@/components/overview/top-picks";
import { WeeklyMoves, type Move } from "@/components/overview/weekly-moves";
import { DeadlinesPanel, InvestorDemandPanel } from "@/components/pipeline/deadlines-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { INVESTOR_FRAMING, LENSES, resolveLens } from "@/lib/lens";
import type { Quadrant } from "@/lib/quadrant";
import { getDeadlines, getInvestorDemand, getPipeline, getWarmPaths } from "@/lib/queries";

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
  const [rows, deadlines, demand, warm] = await Promise.all([getPipeline(lens), getDeadlines(lens), getInvestorDemand(lens), getWarmPaths(lens, 2)]);

  const counts = { invest: 0, accelerate: 0, refer: 0, monitor: 0 } as Record<Quadrant, number>;
  for (const r of rows) if (r.quadrant) counts[r.quadrant]++;
  const top = rows.filter((r) => r.assessed).slice(0, 3);
  const at = (id: string) => `/dashboard/startups/${id}?lens=${lens}`;

  // This week's moves: urgent calls first, then warm intros, then the next step of the most promising ventures.
  const moves: Move[] = [
    ...deadlines.filter((d) => d.days <= 45).slice(0, 2).map((d) => ({
      kind: "deadline" as const,
      title: `Prepare ${d.name.split(" – ")[0]} applications`,
      detail: `${d.eligible.length} ventures fit · start with ${d.eligible[0]?.name ?? "the top match"}`,
      href: `/dashboard/deadlines?lens=${lens}`,
      tag: `${d.days} days left`,
      urgent: d.days <= 21,
    })),
    ...warm.slice(0, 1).map((w) => ({
      kind: "intro" as const,
      title: `Warm intro for ${w.startupName}`,
      detail: w.hops.join(" → "),
      href: at(w.startupId),
      tag: "Intro",
    })),
    ...rows.filter((r) => r.nextStep).slice(0, 2).map((r) => ({
      kind: "action" as const,
      title: r.nextStep!.title,
      detail: r.name,
      href: at(r.id),
      tag: r.nextStep!.owner === "operator" ? "Your team" : "Startup",
    })),
  ];

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {today} · evaluating for <span className="font-medium text-foreground">{lensInfo.label}</span>
        </p>
      </div>

      <StageBar counts={counts} total={rows.length} lens={lens} />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Top picks</h2>
            <p className="text-sm text-muted-foreground">The most promising ventures for this thesis right now</p>
          </div>
          <Link href={`/dashboard/ventures?lens=${lens}`} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-navy hover:underline">
            All ventures <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <TopPicks rows={top} lens={lens} investorLabel={framing.column} />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
        <WeeklyMoves moves={moves} />
        <div className="space-y-6">
          <DeadlinesPanel deadlines={deadlines.slice(0, 3)} lens={lens} max={0} />
          <InvestorDemandPanel investors={demand.slice(0, 4)} lens={lens} title={framing.demand} sub={framing.demandSub} max={0} />
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-12 w-72 rounded-xl" />
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
    </div>
  );
}
