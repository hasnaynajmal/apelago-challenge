import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CalendarClock, ChevronRight, Gauge, ListChecks, Route, Rows3, ShieldCheck, TriangleAlert } from "lucide-react";
import { PipelineDonut, ScoreHistogram } from "@/components/v2/charts";
import { PageHeader } from "@/components/v2/page-header";
import { BarRow, GroupPill, LEVEL_META, LevelDashes, Panel, PanelLink, StatCard, TINTS, VentureAvatar } from "@/components/v2/primitives";
import { Flag } from "@/components/country";
import { Skeleton } from "@/components/ui/skeleton";
import { INVESTOR_FRAMING, LENSES, resolveLens } from "@/lib/lens";
import type { Quadrant } from "@/lib/quadrant";
import { getDeadlines, getInvestorDemand, getPipeline, getWarmPaths } from "@/lib/queries";
import { SECTORS } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export default function Overview({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

const eur = (n: number | null) => (n == null ? null : n >= 1_000_000 ? `€${+(n / 1_000_000).toFixed(1)}M` : `€${Math.round(n / 1000)}k`);
const cleanName = (n: string) => n.replace(/\s*\(.*\)$/, "");

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  await connection();
  const lens = resolveLens((await searchParams).lens);
  const lensInfo = LENSES.find((l) => l.id === lens)!;
  const framing = INVESTOR_FRAMING[lens];
  const [rows, deadlines, demand, warm] = await Promise.all([getPipeline(lens), getDeadlines(lens), getInvestorDemand(lens, 5), getWarmPaths(lens, 1)]);
  const at = (id: string) => `/dashboard/startups/${id}?lens=${lens}`;

  const assessed = rows.filter((r) => r.assessed);
  const counts = { invest: 0, accelerate: 0, refer: 0, monitor: 0 } as Record<Quadrant, number>;
  for (const r of rows) if (r.quadrant) counts[r.quadrant]++;
  const scores = assessed.map((r) => r.promise ?? 0);
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const soon = deadlines.filter((d) => d.days <= 30);
  const biggestGrant = Math.max(0, ...deadlines.map((d) => d.amount ?? 0));
  const eligibleVentures = new Set(deadlines.flatMap((d) => d.eligible.map((e) => e.id))).size;
  const avgLevel = (k: "trl" | "brl" | "oirl" | "irl") => {
    const v = assessed.map((r) => r.levels[k]).filter((x): x is number => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const review = assessed.filter((r) => r.needsReview).length;
  const LEVEL_NAME = { trl: "Technology", brl: "Business", oirl: "Ocean impact", irl: "Investment" } as const;
  const weakest = LEVEL_META.map((l) => ({ k: l.k, v: avgLevel(l.k) })).sort((a, b) => a.v - b.v)[0];

  const moves = [
    ...deadlines.filter((d) => d.days <= 45).slice(0, 2).map((d) => ({
      icon: CalendarClock, tint: "amber" as const, title: `Prepare ${d.name.split(" – ")[0]} applications`,
      detail: `${d.eligible.length} ventures fit · start with ${d.eligible[0]?.name ?? "the top match"}`, href: `/dashboard/deadlines?lens=${lens}`,
      tag: `${d.days} days left`, urgent: d.days <= 21,
    })),
    ...warm.map((w) => ({
      icon: Route, tint: "gold" as const, title: `Warm intro for ${w.startupName}`, detail: w.hops.join(" → "), href: at(w.startupId), tag: "Intro", urgent: false,
    })),
    ...rows.filter((r) => r.nextStep).slice(0, 2).map((r) => ({
      icon: ListChecks, tint: "navy" as const, title: r.nextStep!.title, detail: r.name, href: at(r.id),
      tag: r.nextStep!.owner === "operator" ? "Your team" : "Startup", urgent: false,
    })),
  ];

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-[1320px] space-y-6">
      <PageHeader
        title="Welcome back"
        sub={<>{today} · here&apos;s where the pipeline stands for <span className="font-medium text-foreground">{lensInfo.label}</span>.</>}
      />

      {/* Key figures */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Rows3} tint="navy" value={rows.length} label="Ventures in the pipeline" hint={`${assessed.length} assessed by the Deep Panel`} href={`/dashboard/ventures?lens=${lens}`} />
        <StatCard icon={ShieldCheck} tint="emerald" value={counts.invest} label="Investment-ready" hint="Fit the thesis and mature enough" href={`/dashboard/ventures?lens=${lens}&group=invest`} />
        <StatCard icon={Gauge} tint="gold" value={Math.round(avgScore)} label="Average score" hint={`Out of 100 for ${lensInfo.label}`} />
        <StatCard icon={CalendarClock} tint="amber" value={soon.length} label="Calls closing in 30 days" hint={soon[0] ? `Next: ${soon[0].name.split(" – ")[0]}` : "Nothing urgent"} href={`/dashboard/deadlines?lens=${lens}`} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Pipeline" sub="Ventures by group for this thesis">
          <PipelineDonut counts={counts} lens={lens} />
        </Panel>
        <Panel title="Score distribution" sub={`Average ${Math.round(avgScore)} · top ${Math.round(Math.max(0, ...scores))}`}>
          <ScoreHistogram scores={scores} />
        </Panel>
        <Panel
          title="Portfolio readiness"
          sub="Average level on the 1–9 scales"
          action={review ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"><TriangleAlert className="size-3" />{review} to review</span> : null}
        >
          <div className="space-y-4 pt-2">
            {LEVEL_META.map((l) => (
              <BarRow key={l.k} label={LEVEL_NAME[l.k]} value={avgLevel(l.k)} max={9} color={l.color} />
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            {weakest && <>Biggest gap across the portfolio: <span className="font-medium text-foreground">{LEVEL_NAME[weakest.k].toLowerCase()} readiness</span> (average {weakest.v.toFixed(1)} of 9).</>}
          </p>
        </Panel>
      </div>

      {/* Ventures + deadlines */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Top ventures" sub="Most promising for this thesis right now" action={<PanelLink href={`/dashboard/ventures?lens=${lens}`} />} className="xl:col-span-2" flush>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] sm:min-w-[640px]">
              <thead>
                <tr className="border-y bg-zinc-50/70 text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Venture</th>
                  <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Group</th>
                  <th className="hidden px-3 py-2.5 font-medium md:table-cell">Readiness</th>
                  <th className="hidden px-3 py-2.5 font-medium lg:table-cell">{framing.column}</th>
                  <th className="px-5 py-2.5 text-right font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assessed.slice(0, 6).map((r, i) => (
                  <tr key={r.id} className="group transition-colors hover:bg-zinc-50/70">
                    <td className="px-5 py-3">
                      <Link href={at(r.id)} className="flex items-center gap-3">
                        <VentureAvatar name={r.name} size="sm" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-semibold text-foreground group-hover:text-navy">
                            {r.name}
                            {i === 0 && <span className="rounded-full bg-gold-soft px-1.5 text-[10px] font-semibold text-gold-ink">#1</span>}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Flag code={r.country} className="h-3" />
                            {r.sectors[0] ? SECTORS[r.sectors[0]] : ""}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell"><GroupPill quadrant={r.quadrant} /></td>
                    <td className="hidden px-3 py-3 md:table-cell"><LevelDashes levels={r.levels} /></td>
                    <td className="hidden max-w-44 truncate px-3 py-3 text-zinc-700 lg:table-cell">{r.topInvestor ? cleanName(r.topInvestor.name) : "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[15px] font-semibold tabular">{Math.round(r.promise ?? 0)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Upcoming deadlines" sub="Funding calls in the next 4 months" action={<PanelLink href={`/dashboard/deadlines?lens=${lens}`} />}>
          <ul className="space-y-2.5">
            {deadlines.slice(0, 4).map((d) => {
              const date = new Date(d.date);
              const urgent = d.days <= 30;
              return (
                <li key={d.id}>
                  <Link href={`/dashboard/deadlines?lens=${lens}`} className={cn("flex items-center gap-3 rounded-xl p-3 transition-colors", urgent ? "bg-amber-50 hover:bg-amber-100/70" : "bg-sky-50/70 hover:bg-sky-100/60")}>
                    <span className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-white py-1 shadow-[0_1px_2px_rgb(16_24_40/0.05)]">
                      <span className="text-[15px] font-semibold leading-none tabular">{date.getUTCDate()}</span>
                      <span className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">{date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{d.name.split(" – ")[0]}</span>
                      <span className={cn("block text-xs", urgent ? "text-amber-700" : "text-sky-800/80")}>
                        {d.days} days left{d.amount ? ` · up to ${eur(d.amount)}` : ""} · {d.eligible.length} fit
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
            {deadlines.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No deadlines in the next 4 months.</li>}
          </ul>
          {deadlines.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border p-3">
                <div className="text-lg font-semibold leading-none tabular">{biggestGrant ? eur(biggestGrant) : "—"}</div>
                <div className="mt-1 text-xs text-muted-foreground">largest grant on offer</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-lg font-semibold leading-none tabular">{eligibleVentures}</div>
                <div className="mt-1 text-xs text-muted-foreground">ventures eligible</div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Moves + investors */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="This week's moves" sub="What the team should do next across the portfolio" className="xl:col-span-2" flush>
          <ol className="divide-y border-t">
            {moves.map((m, i) => (
              <li key={i}>
                <Link href={m.href} className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-zinc-50/70">
                  <span className={cn("icon-tile hidden size-9 sm:flex", TINTS[m.tint])}><m.icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[13.5px] font-medium sm:line-clamp-1">{m.title}</span>
                    <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{m.detail}</span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", m.urgent ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600")}>{m.tag}</span>
                  <ChevronRight className="size-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500" />
                </Link>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title={framing.demand} sub={framing.demandSub} action={<PanelLink href={`/dashboard/investors?lens=${lens}`} />}>
          <ul className="space-y-3">
            {demand.map((inv, i) => {
              const max = demand[0]?.ventures.length || 1;
              return (
                <li key={inv.id} className="flex items-center gap-3">
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", i === 0 ? "bg-gold text-navy" : "bg-zinc-100 text-zinc-600")}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <Flag code={inv.hq} className="h-3" />
                      <span className="truncate text-[13px] font-medium">{inv.name}</span>
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-zinc-100">
                      <span className="block h-full rounded-full bg-navy" style={{ width: `${(inv.ventures.length / max) * 100}%` }} />
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular">{inv.ventures.length}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1320px] space-y-6">
      <Skeleton className="h-14 w-80 rounded-xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
    </div>
  );
}
