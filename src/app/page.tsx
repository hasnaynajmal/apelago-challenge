import { Suspense } from "react";
import { connection } from "next/server";
import { CalendarClock, Network, Radar, Waves } from "lucide-react";
import { RadarBoard } from "@/components/radar/radar-board";
import { Skeleton } from "@/components/ui/skeleton";
import { LENSES, resolveLens } from "@/lib/lens";
import { getRadar } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function HomeContent({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const lens = resolveLens((await searchParams).lens);
  const lensInfo = LENSES.find((l) => l.id === lens)!;
  const [items, stats] = await Promise.all([getRadar(lens), getStats()]);
  const assessed = items.filter((i) => i.assessed);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            <Radar className="size-3.5" /> {lensInfo.label} · {lensInfo.kind}
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Ocean Opportunity <span className="text-gradient-gold">Radar</span>
          </h1>
          <p className="mt-3 text-base text-ice/75">
            An AI investment committee scores every ocean venture on technology, business, ocean impact and investment readiness,
            then finds the hidden paths to its next investor, grant and pilot partner.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<Waves className="size-4" />} label="Ventures assessed" value={`${assessed.length}/${items.length}`} />
          <Stat icon={<Network className="size-4" />} label="Investors · funds · partners" value={`${stats.investors}·${stats.funding}·${stats.partners}`} />
          <Stat icon={<Radar className="size-4" />} label="Warm paths found" value={String(stats.warmPaths)} />
          <Stat icon={<CalendarClock className="size-4" />} label="Deadlines < 60 days" value={String(stats.deadlines)} accent />
        </div>
      </section>
      <RadarBoard items={items} lens={lens} />
    </div>
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
  return { investors, funding, partners, warmPaths, deadlines };
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <div className={accent ? "text-gold" : "text-tech"}>{icon}</div>
      <div className="mt-2 text-2xl font-bold tabular">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full max-w-2xl rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <Skeleton className="h-[760px] rounded-3xl" />
      </div>
    </div>
  );
}
