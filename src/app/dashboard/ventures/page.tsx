import { Suspense } from "react";
import { PipelineTable } from "@/components/pipeline/pipeline-table";
import { Skeleton } from "@/components/ui/skeleton";
import { INVESTOR_FRAMING, LENSES, resolveLens } from "@/lib/lens";
import { getPipeline } from "@/lib/queries";

export default function VenturesPage({ searchParams }: PageProps<"/dashboard/ventures">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[700px] max-w-7xl rounded-2xl" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/ventures">["searchParams"] }) {
  const lens = resolveLens((await searchParams).lens);
  const rows = await getPipeline(lens);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ventures</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All {rows.length} ventures ranked for the <span className="font-medium text-foreground">{LENSES.find((l) => l.id === lens)!.label}</span> thesis.
          Filter by group or search, then open a venture for its full assessment.
        </p>
      </div>
      <PipelineTable rows={rows} lens={lens} investorColumn={INVESTOR_FRAMING[lens].column} />
    </div>
  );
}
