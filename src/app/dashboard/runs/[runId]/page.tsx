import { Suspense } from "react";
import { LiveRun } from "@/components/live-run";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveLens } from "@/lib/lens";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default function RunPage({ params, searchParams }: PageProps<"/dashboard/runs/[runId]">) {
  return (
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-2xl" />}>
        <Run params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Run({ params, searchParams }: Pick<PageProps<"/dashboard/runs/[runId]">, "params" | "searchParams">) {
  const [{ runId }, sp] = await Promise.all([params, searchParams]);
  const { data: run } = await supabaseAdmin().from("pipeline_runs").select("startup_id, startups(name)").eq("id", runId).maybeSingle();
  const startupId = run?.startup_id ?? String(sp.startup ?? "");
  const name = (run?.startups as unknown as { name: string } | null)?.name ?? startupId;
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">AI investment committee</p>
        <h1 className="mt-1 text-4xl font-semibold">Assessing {name}</h1>
      </div>
      <LiveRun runId={runId} startupId={startupId} startupName={name} lens={resolveLens(sp.lens)} />
    </div>
  );
}
