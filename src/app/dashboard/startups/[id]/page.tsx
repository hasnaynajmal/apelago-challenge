import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CalendarClock, Landmark, ListChecks, ShieldAlert, Target } from "lucide-react";
import { ActionPlan } from "@/components/dossier/action-plan";
import { ConnectionsPanel } from "@/components/dossier/connections-panel";
import { Constellation } from "@/components/dossier/constellation";
import { IrlRadar } from "@/components/dossier/irl-radar";
import { Opportunities } from "@/components/dossier/opportunities";
import { ReadinessCard } from "@/components/dossier/readiness-card";
import { CountryLabel } from "@/components/country";
import { ExpandableText } from "@/components/expandable-text";
import { WebsiteButton } from "@/components/website-button";
import { ScoreRing } from "@/components/overview/top-picks";
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
  const daysTo = (date: string) => Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
  const counts = {
    investor: d.matches.filter((m) => m.targetType === "investor").length,
    funding: d.matches.filter((m) => m.targetType === "funding").length,
    partner: d.matches.filter((m) => m.targetType === "partner").length,
  };

  return (
    <div className="space-y-8">
      <Link href={`/dashboard/ventures?lens=${lens}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All ventures
      </Link>

      {/* Header */}
      <section className="card-surface flex flex-col gap-8 p-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">{s.name}</h1>
            {s.apelago_alumnus && <span className="rounded-full bg-navy-soft px-2.5 py-0.5 text-xs font-medium text-navy">A'Pelago alumni</span>}
            {quadrant && (
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", QUADRANTS[quadrant].badge)}>{QUADRANTS[quadrant].label}</span>
            )}
            {s.website && <span className="ml-auto"><WebsiteButton url={s.website} /></span>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {(s.city || s.country) && <Chip><CountryLabel code={s.country} city={s.city} /></Chip>}
            {s.founded && <Chip>Founded {s.founded}</Chip>}
            {s.stage && <Chip>{STAGE_LABELS[s.stage]}</Chip>}
            {s.sectors.map((x) => <Chip key={x}>{SECTORS[x]}</Chip>)}
          </div>
          {(s.profile?.summary ?? s.one_liner) && (
            <ExpandableText text={(s.profile?.summary ?? s.one_liner)!} className="mt-4 max-w-3xl text-sm text-zinc-600" />
          )}
        </div>

        {score ? (
          <div className="flex shrink-0 gap-5 lg:w-[400px] lg:border-l lg:pl-6">
            <div className="flex flex-col items-center gap-2">
              <ScoreRing value={score.promise} rank={2} />
              <span className="text-center text-xs text-muted-foreground">for {lensInfo.label}</span>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              {(["irl", "thesis_fit", "impact", "momentum", "team"] as const).map((k) => {
                const v = Math.round(Number(breakdown?.[k] ?? 0) * 100);
                return (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-muted-foreground">{{ irl: "Readiness", thesis_fit: "Thesis fit", impact: "Impact", momentum: "Momentum", team: "Team" }[k]}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-muted"><div className="bar-grow h-1.5 rounded-full bg-navy" style={{ width: `${v}%` }} /></div>
                    <span className="w-7 text-right tabular">{v}</span>
                  </div>
                );
              })}
              <div className="pt-1.5"><RunAssessmentButton startupId={s.id} lens={lens} rerun /></div>
            </div>
          </div>
        ) : (
          <div className="shrink-0 lg:w-[400px] lg:border-l lg:pl-6">
            <div className="text-sm font-semibold">Not assessed yet</div>
            <p className="mt-1 text-sm text-muted-foreground">Research, four readiness scores, matching and an action plan — about a minute.</p>
            <div className="mt-3"><RunAssessmentButton startupId={s.id} lens={lens} /></div>
          </div>
        )}
      </section>

      {score && (
        <>
          {/* At a glance — the decision in one row */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Glance icon={Target} label="Verdict" tone={quadrant ? QUADRANTS[quadrant].dot : undefined}>
              <div className="text-sm font-semibold">{quadrant ? QUADRANTS[quadrant].label : "—"}</div>
              <div className="text-xs leading-snug text-muted-foreground">
                {score.programme ? `Programme fit: ${PROGRAMMES[score.programme]}` : quadrant ? QUADRANTS[quadrant].hint : ""}
              </div>
            </Glance>
            <Glance icon={ListChecks} label="Next move">
              <div className="line-clamp-2 text-sm font-semibold leading-snug">{nextAction?.title ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                {nextAction ? (nextAction.owner === "operator" ? "Your team" : "Startup") : ""}
                {nextAction?.deadline_date ? ` · due ${new Date(nextAction.deadline_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
              </div>
            </Glance>
            <Glance icon={Landmark} label={framing.column}>
              <div className="truncate text-sm font-semibold">{topInvestor ? (topInvestor.target as { name: string }).name.replace(/\s*\(.*\)$/, "") : "—"}</div>
              <div className="text-xs text-muted-foreground">
                {topInvestor ? `${Math.round(topInvestor.fit * 100)}% fit${framing.ownerId ? (topInvestor.status === "ready" ? " · co-invest now" : " · next round") : ""}` : ""}
              </div>
            </Glance>
            <Glance icon={CalendarClock} label={nextDeadline ? "Next deadline" : "Best funding"} tone={nextDeadline && daysTo((nextDeadline.target as Funding).deadline_date!) <= 30 ? "#d97706" : undefined}>
              <div className="line-clamp-1 text-sm font-semibold">{((nextDeadline ?? topFunding)?.target as { name: string } | undefined)?.name.split(" – ")[0] ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                {nextDeadline ? `${daysTo((nextDeadline.target as Funding).deadline_date!)} days left` : topFunding ? "Rolling — apply any time" : ""}
              </div>
            </Glance>
          </section>

          {/* Readiness */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">Readiness</h2>
              <span className="text-xs text-muted-foreground">Each level checked by a calibrated model · open a card for the reasoning</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ReadinessCard framework="trl" a={a.trl} />
              <ReadinessCard framework="brl" a={a.brl} />
              <ReadinessCard framework="oirl" a={a.oirl} />
              <ReadinessCard framework="irl" a={a.irl} />
            </div>
          </section>

          {/* Everything else, one tab at a time */}
          <Tabs defaultValue="opportunities" className="w-full">
            <TabsList variant="line" className="w-full justify-start gap-4 border-b">
              <TabsTrigger value="opportunities">Opportunities <Count n={counts.investor + counts.funding + counts.partner} /></TabsTrigger>
              <TabsTrigger value="plan">Action plan <Count n={d.actions.length} /></TabsTrigger>
              <TabsTrigger value="connections">Connections <Count n={d.connections.length} /></TabsTrigger>
              <TabsTrigger value="deep">Deep dive</TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities" className="pt-6">
              <Opportunities matches={d.matches} investorLabel={framing.tab} investorSub={framing.sub} roleTags={!!framing.ownerId} />
            </TabsContent>

            <TabsContent value="plan" className="pt-6">
              <ActionPlan actions={d.actions} />
            </TabsContent>

            <TabsContent value="connections" className="space-y-6 pt-6">
              <Constellation startupName={s.name} matches={d.matches} connections={d.connections} />
              <ConnectionsPanel connections={d.connections} />
            </TabsContent>

            <TabsContent value="deep" className="space-y-6 pt-6">
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
        </>
      )}
    </div>
  );
}

function Glance({ icon: Icon, label, tone, children }: { icon: React.ComponentType<{ className?: string }>; label: string; tone?: string; children: React.ReactNode }) {
  return (
    <div className="card-surface flex gap-3.5 p-5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted" style={tone ? { color: tone } : undefined}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <div className="text-xs text-muted-foreground">{label}</div>
        {children}
      </div>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-1 rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular">{n}</span>;
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
