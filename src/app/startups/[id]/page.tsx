import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight, ShieldAlert } from "lucide-react";
import { ActionPlan } from "@/components/dossier/action-plan";
import { ConnectionsPanel } from "@/components/dossier/connections-panel";
import { Constellation } from "@/components/dossier/constellation";
import { IrlRadar } from "@/components/dossier/irl-radar";
import { Opportunities } from "@/components/dossier/opportunities";
import { PromiseScore } from "@/components/dossier/promise-score";
import { ReadinessCard } from "@/components/dossier/readiness-card";
import { LensSwitcher } from "@/components/lens-switcher";
import { RunAssessmentButton } from "@/components/run-assessment-button";
import { Skeleton } from "@/components/ui/skeleton";
import { INVESTOR_FRAMING, LENSES, PROGRAMMES, resolveLens } from "@/lib/lens";
import { getDossier } from "@/lib/queries";
import { IMPACT_AREAS, SECTORS, STAGE_LABELS, type ImpactArea, type IrlDimension } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { CountryLabel } from "@/components/country";

export default function StartupPage({ params, searchParams }: PageProps<"/startups/[id]">) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Suspense fallback={<DossierSkeleton />}>
        <Dossier params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Dossier({ params, searchParams }: Pick<PageProps<"/startups/[id]">, "params" | "searchParams">) {
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

  return (
    <div className="space-y-16">
      {/* Header */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={`/?lens=${lens}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All ventures
          </Link>
          <Suspense><LensSwitcher /></Suspense>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-5xl font-semibold tracking-[-0.035em]">{s.name}</h1>
              {s.apelago_alumnus && <span className="rounded-full bg-navy-soft px-3 py-1 text-sm font-medium text-navy">A'Pelago alumni</span>}
            </div>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-600">{s.profile?.summary ?? s.one_liner}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              {(s.city || s.country) && <Chip><CountryLabel code={s.country} city={s.city} /></Chip>}
              {s.founded && <Chip>Founded {s.founded}</Chip>}
              {s.stage && <Chip>{STAGE_LABELS[s.stage]}</Chip>}
              {s.sectors.map((x) => <Chip key={x}>{SECTORS[x]}</Chip>)}
              {s.website && (
                <a href={s.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-1 text-navy hover:underline">
                  {s.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </div>
          </div>

          {score ? (
            <div className="card-surface p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Promise for {lensInfo.label}</div>
                  <PromiseScore value={score.promise} />
                </div>
                <RunAssessmentButton startupId={s.id} lens={lens} rerun />
              </div>
              {score.headline && <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">{score.headline}</p>}
              {breakdown && (
                <div className="mt-5 space-y-2.5">
                  {(["irl", "thesis_fit", "impact", "momentum", "team"] as const).map((k) => {
                    const v = Math.round(Number(breakdown[k] ?? 0) * 100);
                    return (
                      <div key={k} className="flex items-center gap-3 text-sm">
                        <span className="w-24 text-muted-foreground">{{ irl: "Readiness", thesis_fit: "Thesis fit", impact: "Impact", momentum: "Momentum", team: "Team" }[k]}</span>
                        <div className="h-1.5 flex-1 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-navy" style={{ width: `${v}%` }} /></div>
                        <span className="w-8 text-right tabular">{v}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {score.programme && (
                <div className="mt-5 rounded-xl bg-gold-soft p-4">
                  <div className="text-sm font-semibold text-gold-ink">Recommended programme: {PROGRAMMES[score.programme]}</div>
                  {breakdown?.programme_why && <div className="mt-1 text-sm text-zinc-700">{String(breakdown.programme_why)}</div>}
                </div>
              )}
            </div>
          ) : (
            <div className="card-surface p-6">
              <div className="text-base font-semibold">Not assessed yet</div>
              <p className="mt-2 text-[15px] text-muted-foreground">
                The committee researches the venture, scores four readiness frameworks, matches it across the ecosystem and writes an action plan. About a minute.
              </p>
              <div className="mt-5"><RunAssessmentButton startupId={s.id} lens={lens} /></div>
            </div>
          )}
        </div>
      </section>

      {score && (
        <>
          <Section title="Readiness" sub="Four analyst agents, each cross-checked by a calibrated model.">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ReadinessCard framework="trl" a={a.trl} />
              <ReadinessCard framework="brl" a={a.brl} />
              <ReadinessCard framework="oirl" a={a.oirl} />
              <ReadinessCard framework="irl" a={a.irl} />
            </div>
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-surface p-6">
              <h3 className="text-lg font-semibold">Investment readiness</h3>
              <p className="text-sm text-muted-foreground">Ten dimensions, scored 1–5</p>
              {irl?.dimensions && <IrlRadar dimensions={irl.dimensions} />}
              <div className="grid gap-6 sm:grid-cols-2">
                <List title="Strengths" items={irl?.strengths} tone="text-emerald-600" mark="+" />
                <List title="Risks" items={irl?.risks} tone="text-red-600" mark="−" />
              </div>
              {irl?.deal_notes && (
                <p className="mt-5 rounded-xl bg-muted p-4 text-[15px] text-zinc-700"><span className="font-semibold text-foreground">Check first: </span>{irl.deal_notes}</p>
              )}
            </div>

            <div className="card-surface p-6">
              <h3 className="text-lg font-semibold">Ocean impact</h3>
              <p className="text-sm text-muted-foreground">Mapped to the Ocean Impact Navigator</p>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(IMPACT_AREAS) as ImpactArea[]).map((k) => {
                  const on = impact?.impact_areas?.includes(k);
                  return (
                    <div key={k} className={cn("rounded-xl border p-3", on ? "border-emerald-200 bg-emerald-50" : "opacity-50")}>
                      <div className={cn("text-sm font-semibold", on ? "text-emerald-700" : "text-muted-foreground")}>{k}</div>
                      <div className="text-sm leading-snug text-zinc-600">{IMPACT_AREAS[k]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                <Chip>Intensity: <b className="capitalize">{impact?.intensity ?? "–"}</b></Chip>
                <Chip>Impact grows with revenue: <b className="tabular">{impact?.coupling != null ? `${Math.round(impact.coupling * 100)}%` : "–"}</b></Chip>
              </div>
              <div className="mt-5 space-y-2.5">
                {impact?.kpis?.slice(0, 5).map((k) => (
                  <div key={k.code + k.name} className="flex items-start gap-3 text-[15px]">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-sm text-emerald-700">{k.code}</span>
                    <span className="text-zinc-700">{k.name}{k.estimate && <span className="text-muted-foreground"> — {k.estimate}</span>}</span>
                  </div>
                ))}
              </div>
              {!!impact?.red_flags?.length && (
                <div className="mt-5 rounded-xl border border-red-100 bg-red-50/60 p-4">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-red-700"><ShieldAlert className="size-4" /> Impact-washing checks</div>
                  <ul className="mt-1.5 space-y-1 text-sm text-zinc-700">{impact.red_flags.slice(0, 3).map((x) => <li key={x}>· {x}</li>)}</ul>
                </div>
              )}
            </div>
          </div>

          <Section title="Opportunity map" sub="Where the venture sits in the ecosystem. Gold routes are warm intro paths.">
            <Constellation startupName={s.name} matches={d.matches} connections={d.connections} />
          </Section>

          <Section title="Hidden connections" sub="Paths and openings found in the ecosystem graph that a manual review would likely miss.">
            <ConnectionsPanel connections={d.connections} />
          </Section>

          <Section title="Next best opportunities" sub={`Ranked for ${lensInfo.label}. Each match explains why it fits and what still blocks it.`}>
            <Opportunities matches={d.matches} investorLabel={framing.tab} investorSub={framing.sub} roleTags={!!framing.ownerId} />
          </Section>

          <Section title="Action plan" sub="What the startup and the operator team should do next.">
            <ActionPlan actions={d.actions} />
          </Section>

          {s.profile && (
            <Section title="Evidence" sub="Everything above is grounded in these findings.">
              <div className="grid gap-6 lg:grid-cols-3">
                <ul className="card-surface space-y-3 p-6 text-[15px] lg:col-span-2">
                  {s.profile.evidence.slice(0, 12).map((e, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-navy" />
                      <span className="text-zinc-700">
                        {e.claim}
                        {e.source?.startsWith("http") && (
                          <a href={e.source} target="_blank" rel="noreferrer" className="ml-1.5 text-sm text-navy hover:underline">source</a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-4">
                  {!!s.profile.team?.length && (
                    <div className="card-surface p-6">
                      <div className="text-base font-semibold">Team</div>
                      <ul className="mt-3 space-y-2 text-[15px]">
                        {s.profile.team.slice(0, 5).map((t) => <li key={t.name}>{t.name} <span className="text-muted-foreground">· {t.role}</span></li>)}
                      </ul>
                    </div>
                  )}
                  <div className="card-surface p-6">
                    <div className="text-base font-semibold">Sources <span className="font-normal text-muted-foreground">{s.profile.sources.length}</span></div>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {s.profile.sources.slice(0, 8).map((u) => (
                        <li key={u} className="truncate"><a href={u} target="_blank" rel="noreferrer" className="text-navy hover:underline">{u.replace(/^https?:\/\/(www\.)?/, "")}</a></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border bg-white px-3 py-1 text-zinc-700">{children}</span>;
}

function List({ title, items, tone, mark }: { title: string; items?: string[]; tone: string; mark: string }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-2 space-y-1.5 text-[15px] text-zinc-700">
        {items?.slice(0, 4).map((x) => <li key={x} className="flex gap-2"><span className={tone}>{mark}</span>{x}</li>)}
      </ul>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">{title}</h2>
        {sub && <p className="mt-1.5 text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function DossierSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
