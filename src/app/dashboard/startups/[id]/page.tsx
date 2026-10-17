import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CalendarClock, Gauge, Landmark, LayoutGrid, ListChecks, Microscope, Network, Quote, Route, ShieldAlert, Target, TriangleAlert } from "lucide-react";
import { PageActions } from "@/components/v2/page-header";
import { BarRow, GroupPill, LEVEL_META, Panel, ScoreGauge, TINTS, VentureAvatar, type Tint } from "@/components/v2/primitives";
import { ActionPlan } from "@/components/dossier/action-plan";
import { ConnectionsPanel } from "@/components/dossier/connections-panel";
import { Constellation } from "@/components/dossier/constellation";
import { IrlRadar } from "@/components/dossier/irl-radar";
import { Opportunities } from "@/components/dossier/opportunities";
import { ReadinessGrid } from "@/components/dossier/readiness-card";
import { CountryLabel } from "@/components/country";
import { FitText } from "@/components/fit-text";
import { WebsiteButton } from "@/components/website-button";
import { QUADRANTS } from "@/components/pipeline/quadrants";
import { RunAssessmentButton } from "@/components/run-assessment-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INVESTOR_FRAMING, LENSES, PROGRAMMES, resolveLens } from "@/lib/lens";
import { quadrantOf } from "@/lib/quadrant";
import { getDossier } from "@/lib/queries";
import { IMPACT_AREAS, SECTORS, STAGE_LABELS, type ImpactArea, type IrlDimension } from "@/lib/taxonomy";
import type { Funding } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function StartupPage({ params, searchParams }: PageProps<"/dashboard/startups/[id]">) {
  return (
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={<DossierSkeleton />}>
        <Dossier params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Dossier({ params, searchParams }: Pick<PageProps<"/dashboard/startups/[id]">, "params" | "searchParams">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const lens = resolveLens(sp.lens);
  const d = await getDossier(id, lens);
  if (!d) notFound();
  const { startup: s, assessments: a, score } = d;
  const lensInfo = LENSES.find((l) => l.id === lens)!;
  const framing = INVESTOR_FRAMING[lens];
  const irl = a.irl?.details as { dimensions?: Record<IrlDimension, { score: number | null; note: string }>; strengths?: string[]; risks?: string[]; deal_notes?: string } | undefined;
  const impact = a.oirl?.details as { impact_areas?: ImpactArea[]; kpis?: { code: string; name: string; estimate: string | null }[]; coupling?: number; intensity?: string; red_flags?: string[] } | undefined;
  const breakdown = score?.breakdown as Record<string, number | string | undefined> | undefined;

  // At-a-glance facts
  const levels = [a.trl?.level, a.brl?.level, a.irl?.level].filter((x): x is number => x != null);
  const readiness = levels.length ? levels.reduce((x, y) => x + y, 0) / levels.length : null;
  const quadrant = readiness != null && score ? quadrantOf(readiness, score.thesis_fit) : null;
  const topInvestor = d.matches.find((m) => m.targetType === "investor");
  const nextDeadline = d.matches
    .filter((m) => m.targetType === "funding" && (m.target as Funding).deadline_date)
    .sort((x, y) => ((x.target as Funding).deadline_date! < (y.target as Funding).deadline_date! ? -1 : 1))[0];
  const topFunding = d.matches.find((m) => m.targetType === "funding");
  const nextAction = d.actions[0];
  // eslint-disable-next-line react-hooks/purity -- server component rendered per request (after connection()), not re-rendered
  const daysTo = (date: string) => Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
  const counts = {
    investor: d.matches.filter((m) => m.targetType === "investor").length,
    funding: d.matches.filter((m) => m.targetType === "funding").length,
    partner: d.matches.filter((m) => m.targetType === "partner").length,
  };

  const LEVEL_NAME = { trl: "Technology", brl: "Business", oirl: "Ocean impact", irl: "Investment" } as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/dashboard/ventures?lens=${lens}`} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All ventures
        </Link>
        <div className="flex items-center gap-2"><PageActions /></div>
      </div>

      {/* Header */}
      <section className="card-surface flex flex-col gap-6 p-6 lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-4">
            <VentureAvatar name={s.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[26px] font-semibold leading-tight tracking-tight">{s.name}</h1>
                <GroupPill quadrant={quadrant} />
                {s.apelago_alumnus && <span className="rounded-full bg-navy-soft px-2.5 py-0.5 text-xs font-medium text-navy">A&apos;Pelago alumni</span>}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                {(s.city || s.country) && <CountryLabel code={s.country} city={s.city} />}
                {s.founded && <span>Founded {s.founded}</span>}
                {s.stage && <span>{STAGE_LABELS[s.stage]}</span>}
                {s.sectors.slice(0, 2).map((x) => <span key={x}>{SECTORS[x]}</span>)}
              </div>
            </div>
            {s.website && <span className="hidden sm:block"><WebsiteButton url={s.website} /></span>}
          </div>
          {(s.profile?.summary ?? s.one_liner) && (
            <FitText text={(s.profile?.summary ?? s.one_liner)!} className="mt-4 flex-1 text-[14px] text-zinc-600" />
          )}
          {s.website && <span className="mt-3 sm:hidden"><WebsiteButton url={s.website} /></span>}
        </div>

        {score ? (
          <div className="relative flex shrink-0 flex-col items-center justify-center rounded-2xl bg-zinc-50/80 px-6 pb-5 pt-6 lg:w-[300px]">
            <div className="absolute right-3 top-3"><RunAssessmentButton startupId={s.id} lens={lens} rerun compact /></div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Overall score</div>
            <ScoreGauge value={score.promise} label={`for ${lensInfo.label}`} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="rounded-full bg-white px-2.5 py-1 font-medium ring-1 ring-zinc-200">Thesis fit {Math.round(score.thesis_fit * 100)}%</span>
              {score.programme && <span className="rounded-full bg-gold-soft px-2.5 py-1 font-medium text-gold-ink">{PROGRAMMES[score.programme]}</span>}
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col justify-center rounded-2xl bg-zinc-50/80 p-6 lg:w-[320px]">
            <div className="text-sm font-semibold">Not assessed yet</div>
            <p className="mt-1 text-sm text-muted-foreground">Research, four readiness scores, matching and an action plan — about a minute.</p>
            <div className="mt-3"><RunAssessmentButton startupId={s.id} lens={lens} /></div>
          </div>
        )}
      </section>

      {score && (
        <Tabs defaultValue="overview" className="w-full gap-5">
          <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
            <TabsList className="h-auto gap-0.5 rounded-xl bg-zinc-200/60 p-1 group-data-horizontal/tabs:h-auto">
              <TabsTrigger value="overview" className={SEG}><LayoutGrid /> Overview</TabsTrigger>
              <TabsTrigger value="readiness" className={SEG}><Gauge /> Readiness</TabsTrigger>
              <TabsTrigger value="opportunities" className={SEG}><Network /> Opportunities <Count n={counts.investor + counts.funding + counts.partner} /></TabsTrigger>
              <TabsTrigger value="plan" className={SEG}><ListChecks /> Action plan <Count n={d.actions.length} /></TabsTrigger>
              <TabsTrigger value="connections" className={SEG}><Route /> Connections <Count n={d.connections.length} /></TabsTrigger>
              <TabsTrigger value="deep" className={SEG}><Microscope /> Deep dive</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            {score.headline && (
              <div className="card-surface flex gap-4 p-5">
                <span className={cn("icon-tile size-10", TINTS.navy)}><Quote className="size-4" /></span>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Investment view</div>
                  <p className="mt-1 text-[15px] leading-relaxed text-foreground">{score.headline}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Glance icon={Target} tint="emerald" label="Verdict">
                <div className="text-[15px] font-semibold">{quadrant ? QUADRANTS[quadrant].label : "—"}</div>
                <div className="text-xs leading-snug text-muted-foreground">{quadrant ? QUADRANTS[quadrant].hint : ""}</div>
              </Glance>
              <Glance icon={ListChecks} tint="navy" label="Next move">
                <div className="line-clamp-2 text-[15px] font-semibold leading-snug">{nextAction?.title ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {nextAction ? (nextAction.owner === "operator" ? "Your team" : "Startup") : ""}
                  {nextAction?.deadline_date ? ` · due ${new Date(nextAction.deadline_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
                </div>
              </Glance>
              <Glance icon={Landmark} tint="violet" label={framing.column}>
                <div className="truncate text-[15px] font-semibold">{topInvestor ? (topInvestor.target as { name: string }).name.replace(/\s*\(.*\)$/, "") : "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {topInvestor ? `${Math.round(topInvestor.fit * 100)}% fit${framing.ownerId ? (topInvestor.status === "ready" ? " · co-invest now" : " · next round") : ""}` : ""}
                </div>
              </Glance>
              <Glance icon={CalendarClock} tint={nextDeadline && daysTo((nextDeadline.target as Funding).deadline_date!) <= 30 ? "amber" : "sky"} label={nextDeadline ? "Next deadline" : "Best funding"}>
                <div className="line-clamp-1 text-[15px] font-semibold">{((nextDeadline ?? topFunding)?.target as { name: string } | undefined)?.name.split(" – ")[0] ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {nextDeadline ? `${daysTo((nextDeadline.target as Funding).deadline_date!)} days left` : topFunding ? "Rolling — apply any time" : ""}
                </div>
              </Glance>
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <Panel title="Why this score" sub={`What the ${Math.round(score.promise)} is made of, for ${lensInfo.label}`} className="lg:col-span-3">
                <div className="space-y-3.5 pt-1">
                  {(["irl", "thesis_fit", "impact", "momentum", "team"] as const).map((k) => (
                    <BarRow key={k} label={{ irl: "Readiness", thesis_fit: "Thesis fit", impact: "Ocean impact", momentum: "Momentum", team: "Team" }[k]} value={Math.round(Number(breakdown?.[k] ?? 0) * 100)} />
                  ))}
                </div>
              </Panel>
              <Panel title="Readiness" sub="1–9 scales · reasoning in the Readiness tab" className="lg:col-span-2">
                <div className="grid grid-cols-2 gap-2.5">
                  {LEVEL_META.map((l) => {
                    const x = a[l.k];
                    return (
                      <div key={l.k} className="rounded-xl border p-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {LEVEL_NAME[l.k]}
                          {x?.needs_review && <TriangleAlert className="size-3.5 text-amber-600" />}
                        </div>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-2xl font-semibold tabular" style={{ color: l.color }}>{x?.level ?? "–"}</span>
                          <span className="text-xs text-muted-foreground">/ 9</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">{x?.confidence != null ? `${Math.round(x.confidence * 100)}% confident` : ""}</div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="readiness" className="space-y-3">
            <p className="text-[13px] text-muted-foreground">Every level is double-checked by the Second Opinion model. Open a card for the reasoning, what is needed next and what evidence is missing.</p>
            <ReadinessGrid assessments={a} />
          </TabsContent>

          <TabsContent value="opportunities">
            <Opportunities matches={d.matches} investorLabel={framing.tab} investorSub={framing.sub} roleTags={!!framing.ownerId} />
          </TabsContent>

          <TabsContent value="plan">
            <ActionPlan actions={d.actions} />
          </TabsContent>

          <TabsContent value="connections" className="space-y-5">
            <Constellation startupName={s.name} matches={d.matches} connections={d.connections} />
            <ConnectionsPanel connections={d.connections} />
          </TabsContent>

          <TabsContent value="deep" className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="card-surface p-5">
                  <h3 className="text-sm font-semibold">Investment readiness · 10 dimensions</h3>
                  {irl?.dimensions && <IrlRadar dimensions={irl.dimensions} />}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <List title="Strengths" items={irl?.strengths} tone="text-emerald-600" mark="+" />
                    <List title="Risks" items={irl?.risks} tone="text-red-600" mark="−" />
                  </div>
                  {irl?.deal_notes && <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-zinc-700"><span className="font-semibold text-foreground">Check first: </span>{irl.deal_notes}</p>}
                </div>
                <div className="card-surface p-5">
                  <h3 className="text-sm font-semibold">Ocean impact · Ocean Impact Navigator</h3>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(Object.keys(IMPACT_AREAS) as ImpactArea[]).map((k) => {
                      const on = impact?.impact_areas?.includes(k);
                      return (
                        <div key={k} className={cn("rounded-lg border p-2.5", on ? "border-emerald-200 bg-emerald-50" : "opacity-50")}>
                          <div className={cn("text-xs font-semibold", on ? "text-emerald-700" : "text-muted-foreground")}>{k}</div>
                          <div className="text-xs leading-snug text-zinc-600">{IMPACT_AREAS[k]}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Chip>Intensity: <b className="capitalize">{impact?.intensity ?? "–"}</b></Chip>
                    <Chip>Impact grows with revenue: <b className="tabular">{impact?.coupling != null ? `${Math.round(impact.coupling * 100)}%` : "–"}</b></Chip>
                  </div>
                  <div className="mt-4 space-y-2">
                    {impact?.kpis?.slice(0, 5).map((k) => (
                      <div key={k.code + k.name} className="flex items-start gap-2.5 text-sm">
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-xs text-emerald-700">{k.code}</span>
                        <span className="text-zinc-700">{k.name}{k.estimate && <span className="text-muted-foreground"> — {k.estimate}</span>}</span>
                      </div>
                    ))}
                  </div>
                  {!!impact?.red_flags?.length && (
                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50/60 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700"><ShieldAlert className="size-3.5" /> Impact-washing checks</div>
                      <ul className="mt-1 space-y-1 text-xs text-zinc-700">{impact.red_flags.slice(0, 3).map((x) => <li key={x}>· {x}</li>)}</ul>
                    </div>
                  )}
                </div>
              </div>

              {s.profile && (
                <div className="grid gap-5 lg:grid-cols-3">
                  <div className="card-surface p-5 lg:col-span-2">
                    <h3 className="text-sm font-semibold">Evidence</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      {s.profile.evidence.slice(0, 12).map((e, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-navy" />
                          <span className="text-zinc-700">
                            {e.claim}
                            {e.source?.startsWith("http") && <a href={e.source} target="_blank" rel="noreferrer" className="ml-1.5 text-xs text-navy hover:underline">source</a>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-5">
                    {!!s.profile.team?.length && (
                      <div className="card-surface p-5">
                        <h3 className="text-sm font-semibold">Team</h3>
                        <ul className="mt-2 space-y-1.5 text-sm">
                          {s.profile.team.slice(0, 5).map((t) => <li key={t.name}>{t.name} <span className="text-muted-foreground">· {t.role}</span></li>)}
                        </ul>
                      </div>
                    )}
                    <div className="card-surface p-5">
                      <h3 className="text-sm font-semibold">Sources <span className="font-normal text-muted-foreground">{s.profile.sources.length}</span></h3>
                      <ul className="mt-2 space-y-1 text-xs">
                        {s.profile.sources.slice(0, 8).map((u) => (
                          <li key={u} className="truncate"><a href={u} target="_blank" rel="noreferrer" className="text-navy hover:underline">{u.replace(/^https?:\/\/(www\.)?/, "")}</a></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Glance({ icon: Icon, label, tint, children }: { icon: React.ComponentType<{ className?: string }>; label: string; tint: Tint; children: React.ReactNode }) {
  return (
    <div className="card-surface p-4 sm:p-5">
      <span className={cn("icon-tile hidden size-9 sm:flex", TINTS[tint])}><Icon className="size-4" /></span>
      <div className="min-w-0 space-y-0.5 sm:mt-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        {children}
      </div>
    </div>
  );
}

// Segmented pill tabs: the active tab is a white pill on a grey track.
const SEG = "h-9 flex-none gap-1.5 rounded-lg border-0 px-3 text-[13px] font-medium text-zinc-600 hover:text-foreground focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-navy/20 focus-visible:outline-none data-active:bg-white data-active:text-foreground data-active:shadow-[0_1px_3px_rgb(16_24_40/0.1)] [&_svg]:size-4";

function Count({ n }: { n: number }) {
  return <span className="rounded-md bg-zinc-200/70 px-1.5 text-[11px] text-zinc-600 tabular">{n}</span>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border bg-white px-2.5 py-0.5 text-zinc-700">{children}</span>;
}

function List({ title, items, tone, mark }: { title: string; items?: string[]; tone: string; mark: string }) {
  return (
    <div>
      <div className="text-xs font-semibold">{title}</div>
      <ul className="mt-1.5 space-y-1 text-sm text-zinc-700">
        {items?.slice(0, 4).map((x) => <li key={x} className="flex gap-2"><span className={tone}>{mark}</span>{x}</li>)}
      </ul>
    </div>
  );
}

function DossierSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}</div>
    </div>
  );
}
