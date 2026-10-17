import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, CalendarClock, Gauge, Network, Route } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabaseAdmin } from "@/lib/supabase/admin";

const FEATURES = [
  { icon: Gauge, title: "Four readiness levels", text: "Technology, business, ocean impact and investment readiness — with evidence and calibrated confidence." },
  { icon: Network, title: "Ranked opportunities", text: "Co-investors, grants and pilot partners for every venture, each with reasons and blockers." },
  { icon: Route, title: "Hidden connections", text: "Warm intro paths, consortium partners and the one milestone that unlocks the most funding." },
  { icon: CalendarClock, title: "Deadlines that matter", text: "Upcoming calls across the portfolio and exactly which ventures should apply." },
];

export default function Landing() {
  return (
    <>
      <Suspense fallback={<Skeleton className="mx-auto my-20 h-96 max-w-4xl rounded-2xl" />}>
        <HeroWithStats />
      </Suspense>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold">From scattered data to a decision</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Built for the people who run the A'Pelago programmes and the Redstone Blue fund.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-surface p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-navy-soft text-navy">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="h-11 rounded-full px-6 text-[15px]">
            <Link href="/dashboard">Open the dashboard <ArrowRight /></Link>
          </Button>
        </div>
      </section>
    </>
  );
}

async function HeroWithStats() {
  await connection(); // deadline window depends on "now"
  const db = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const [total, scored, investors, funding, partners, warmPaths, deadlines] = await Promise.all([
    count(db.from("startups").select("*", { count: "exact", head: true })),
    db.from("scores").select("startup_id").then((r) => new Set((r.data ?? []).map((x) => x.startup_id)).size),
    count(db.from("investors").select("*", { count: "exact", head: true })),
    count(db.from("funding").select("*", { count: "exact", head: true })),
    count(db.from("partners").select("*", { count: "exact", head: true })),
    count(db.from("connections").select("*", { count: "exact", head: true }).eq("kind", "warm_path")),
    count(db.from("funding").select("*", { count: "exact", head: true }).gte("deadline_date", today).lte("deadline_date", soon)),
  ]);
  return <Hero stats={{ assessed: scored, total, opportunities: investors + funding + partners, warmPaths, deadlines }} />;
}
