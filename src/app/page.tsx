import { Suspense } from "react";
import { connection } from "next/server";
import { Hero } from "@/components/home/hero";
import { LensSwitcher } from "@/components/lens-switcher";
import { DeadlinesPanel } from "@/components/pipeline/deadlines-panel";
import { PipelineTable } from "@/components/pipeline/pipeline-table";
import { PortfolioMatrix } from "@/components/pipeline/portfolio-matrix";
import { QUADRANTS } from "@/components/pipeline/quadrants";
import { Skeleton } from "@/components/ui/skeleton";
import { LENSES, resolveLens } from "@/lib/lens";
import type { Quadrant } from "@/lib/quadrant";
import { getDeadlines, getPipeline } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  await connection(); // deadlines and stats depend on "now"
  const lens = resolveLens((await searchParams).lens);
  const lensInfo = LENSES.find((l) => l.id === lens)!;
  const [rows, deadlines, stats] = await Promise.all([getPipeline(lens), getDeadlines(lens), getStats()]);
  const count = (q: Quadrant) => rows.filter((r) => r.quadrant === q).length;

  return (
    <>
      <Hero stats={{ ...stats, assessed: rows.filter((r) => r.assessed).length, total: rows.length, deadlines: deadlines.filter((d) => d.days <= 60).length }} />

      <section id="pipeline" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-16">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">Pipeline</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Every venture placed by how ready it is and how well it fits the <span className="font-medium text-foreground">{lensInfo.label}</span> thesis.
              Click any venture for the full assessment.
            </p>
          </div>
          <Suspense fallback={<Skeleton className="h-11 w-96 rounded-full" />}>
            <LensSwitcher />
          </Suspense>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-4">
            <PortfolioMatrix rows={rows} lens={lens} />
            <div className="grid gap-3 sm:grid-cols-2">
              {(["invest", "accelerate", "refer", "monitor"] as const).map((q) => (
                <div key={q} className="card-surface flex gap-3 p-4">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: QUADRANTS[q].dot }} />
                  <div>
                    <div className="text-[15px] font-semibold">
                      {QUADRANTS[q].label} <span className="font-normal text-muted-foreground tabular">· {count(q)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{QUADRANTS[q].hint}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div id="deadlines" className="scroll-mt-20">
            <DeadlinesPanel deadlines={deadlines} lens={lens} />
          </div>
        </div>

        <div className="mt-12">
          <h3 className="mb-4 text-xl font-semibold">All ventures</h3>
          <PipelineTable rows={rows} lens={lens} />
        </div>
      </section>
    </>
  );
}

async function getStats() {
  const db = supabaseAdmin();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const [investors, funding, partners, warmPaths] = await Promise.all([
    count(db.from("investors").select("*", { count: "exact", head: true })),
    count(db.from("funding").select("*", { count: "exact", head: true })),
    count(db.from("partners").select("*", { count: "exact", head: true })),
    count(db.from("connections").select("*", { count: "exact", head: true }).eq("kind", "warm_path")),
  ]);
  return { opportunities: investors + funding + partners, warmPaths };
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-20">
      <Skeleton className="mx-auto h-40 w-full max-w-3xl rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="h-[480px] w-full rounded-2xl" />
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    </div>
  );
}
