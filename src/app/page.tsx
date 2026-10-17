import { Suspense } from "react";
import { connection } from "next/server";
import { Hero } from "@/components/home/hero";
import { LensSwitcher } from "@/components/lens-switcher";
import { RadarBoard } from "@/components/radar/radar-board";
import { Skeleton } from "@/components/ui/skeleton";
import { LENSES, resolveLens } from "@/lib/lens";
import { getRadar } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const lens = resolveLens((await searchParams).lens);
  const lensInfo = LENSES.find((l) => l.id === lens)!;
  const [items, stats] = await Promise.all([getRadar(lens), getStats()]);

  return (
    <>
      <Hero stats={{ ...stats, assessed: items.filter((i) => i.assessed).length, total: items.length }} />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Viewing through the {lensInfo.label} thesis</p>
            <h2 className="mt-1 text-3xl font-semibold">The radar</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Each dot is a venture. The closer to the centre, the more promising it is for this thesis. Switch the lens to see how priorities change.
            </p>
          </div>
          <Suspense fallback={<Skeleton className="h-11 w-96 rounded-full" />}>
            <LensSwitcher />
          </Suspense>
        </div>
        <RadarBoard items={items} lens={lens} />
      </section>
    </>
  );
}

async function getStats() {
  await connection(); // request-time data: deadline window depends on "now"
  const db = supabaseAdmin();
  const soon = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const [investors, funding, partners, warmPaths, deadlines] = await Promise.all([
    count(db.from("investors").select("*", { count: "exact", head: true })),
    count(db.from("funding").select("*", { count: "exact", head: true })),
    count(db.from("partners").select("*", { count: "exact", head: true })),
    count(db.from("connections").select("*", { count: "exact", head: true }).eq("kind", "warm_path")),
    count(db.from("funding").select("*", { count: "exact", head: true }).gte("deadline_date", today).lte("deadline_date", soon)),
  ]);
  return { opportunities: investors + funding + partners, warmPaths, deadlines };
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-20">
      <Skeleton className="mx-auto h-40 w-full max-w-3xl rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <Skeleton className="h-[720px] rounded-2xl" />
      </div>
    </div>
  );
}
