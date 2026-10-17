import { Suspense } from "react";
import { PipelineTable } from "@/components/pipeline/pipeline-table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/v2/page-header";
import { INVESTOR_FRAMING, LENSES, resolveLens } from "@/lib/lens";
import { getPipeline } from "@/lib/queries";
import type { Quadrant } from "@/lib/quadrant";

export default function VenturesPage({ searchParams }: PageProps<"/dashboard/ventures">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[700px] max-w-[1320px] rounded-2xl" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/ventures">["searchParams"] }) {
  const sp = await searchParams;
  const lens = resolveLens(sp.lens);
  const group = ["invest", "accelerate", "refer", "monitor"].includes(String(sp.group)) ? (String(sp.group) as Quadrant) : "all";
  const rows = await getPipeline(lens);
  return (
    <div className="mx-auto max-w-[1320px] space-y-6">
      <PageHeader
        title="Ventures"
        sub={<>All {rows.length} ventures ranked for <span className="font-medium text-foreground">{LENSES.find((l) => l.id === lens)!.label}</span>. Filter, search, then open one.</>}
      />
      <PipelineTable key={group} rows={rows} lens={lens} investorColumn={INVESTOR_FRAMING[lens].column} initialFilter={group} />
    </div>
  );
}
