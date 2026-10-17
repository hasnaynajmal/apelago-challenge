import { Suspense } from "react";
import { connection } from "next/server";
import { DeadlinesPanel } from "@/components/pipeline/deadlines-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveLens } from "@/lib/lens";
import { getDeadlines } from "@/lib/queries";

export default function DeadlinesPage({ searchParams }: PageProps<"/dashboard/deadlines">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[600px] max-w-4xl rounded-2xl" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/deadlines">["searchParams"] }) {
  await connection();
  const lens = resolveLens((await searchParams).lens);
  const deadlines = await getDeadlines(lens, 365);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deadlines</h1>
        <p className="mt-1 text-sm text-muted-foreground">Funding calls with a fixed deadline in the next 12 months, and which ventures should apply.</p>
      </div>
      <DeadlinesPanel deadlines={deadlines} lens={lens} title="Upcoming calls" sub={`${deadlines.length} calls · rolling programmes are listed on each venture`} max={8} />
    </div>
  );
}
