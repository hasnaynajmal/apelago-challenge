import { Suspense } from "react";
import { InvestorDemandPanel } from "@/components/pipeline/deadlines-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { INVESTOR_FRAMING, resolveLens } from "@/lib/lens";
import { getInvestorDemand } from "@/lib/queries";

export default function InvestorsPage({ searchParams }: PageProps<"/dashboard/investors">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[600px] max-w-4xl rounded-2xl" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/investors">["searchParams"] }) {
  const lens = resolveLens((await searchParams).lens);
  const framing = INVESTOR_FRAMING[lens];
  const investors = await getInvestorDemand(lens, 20);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{framing.ownerId ? "Co-investors" : "Investors"}</h1>
        <p className="mt-1.5 text-muted-foreground">{framing.sub} Ranked by how many ventures they are a top-3 match for.</p>
      </div>
      <InvestorDemandPanel investors={investors} lens={lens} title={framing.demand} sub={framing.demandSub} max={8} />
    </div>
  );
}
