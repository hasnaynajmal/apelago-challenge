import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { LiveRun } from "@/components/live-run";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveLens } from "@/lib/lens";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default function RunPage({ params, searchParams }: PageProps<"/dashboard/runs/[runId]">) {
  return (
    <div className="mx-auto max-w-6xl">
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-2xl" />}>
        <Run params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Run({ params, searchParams }: Pick<PageProps<"/dashboard/runs/[runId]">, "params" | "searchParams">) {
  const [{ runId }, sp] = await Promise.all([params, searchParams]);
  const lens = resolveLens(sp.lens);
  const { data: run } = await supabaseAdmin().from("pipeline_runs").select("startup_id, startups(name)").eq("id", runId).maybeSingle();
  const startupId = run?.startup_id ?? String(sp.startup ?? "");
  const name = (run?.startups as unknown as { name: string } | null)?.name ?? startupId;
  return (
    <div className="space-y-6">
      <Link href={`/dashboard/assess?lens=${lens}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Assess another startup
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Assessing {name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The Deep Panel researches the venture, scores its readiness, matches it across the ecosystem and writes a plan.
        </p>
      </div>
      <LiveRun runId={runId} startupId={startupId} startupName={name} lens={lens} />
    </div>
  );
}
