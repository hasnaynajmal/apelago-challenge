import { Suspense } from "react";
import { LiveRun } from "@/components/live-run";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveLens } from "@/lib/lens";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default function RunPage({ params, searchParams }: PageProps<"/runs/[runId]">) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <Suspense fallback={<Skeleton className="h-[560px] w-full rounded-3xl" />}>
        <Run params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Run({ params, searchParams }: Pick<PageProps<"/runs/[runId]">, "params" | "searchParams">) {
  const [{ runId }, sp] = await Promise.all([params, searchParams]);
  const { data: run } = await supabaseAdmin().from("pipeline_runs").select("startup_id, startups(name)").eq("id", runId).maybeSingle();
  const startupId = run?.startup_id ?? String(sp.startup ?? "");
  const name = (run?.startups as unknown as { name: string } | null)?.name ?? startupId;
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">AI investment committee · live</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Assessing {name}</h1>
      </div>
      <LiveRun runId={runId} startupId={startupId} startupName={name} lens={resolveLens(sp.lens)} />
    </div>
  );
}
