import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, GraduationCap, MapPin, ShieldAlert, Users } from "lucide-react";
import { ActionPlan } from "@/components/dossier/action-plan";
import { ConnectionsPanel } from "@/components/dossier/connections-panel";
import { IrlRadar } from "@/components/dossier/irl-radar";
import { Opportunities } from "@/components/dossier/opportunities";
import { ReadinessCard } from "@/components/dossier/readiness-card";
import { RunAssessmentButton } from "@/components/run-assessment-button";
import { Skeleton } from "@/components/ui/skeleton";
import { LENSES, PROGRAMMES, resolveLens } from "@/lib/lens";
import { getDossier } from "@/lib/queries";
import { IMPACT_AREAS, SECTORS, STAGE_LABELS, type ImpactArea, type IrlDimension } from "@/lib/taxonomy";

export default function StartupPage({ params, searchParams }: PageProps<"/startups/[id]">) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
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
  const irlDetails = a.irl?.details as { dimensions?: Record<IrlDimension, { score: number | null; note: string }>; strengths?: string[]; risks?: string[]; deal_notes?: string } | undefined;
  const impact = a.oirl?.details as { impact_areas?: ImpactArea[]; kpis?: { code: string; name: string; estimate: string | null }[]; coupling?: number; intensity?: string; red_flags?: string[] } | undefined;
  const breakdown = score?.breakdown as { irl?: number; thesis_fit?: number; impact?: number; momentum?: number; team?: number; programme_why?: string; fit_notes?: string[] } | undefined;

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="space-y-5">
        <Link href={`/?lens=${lens}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to radar
        </Link>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-4xl font-bold tracking-tight">{s.name}</h1>
              {s.apelago_alumnus && (
                <span className="flex items-center gap-1 rounded-full bg-navy-500/40 px-2.5 py-1 text-[11px] font-semibold text-ice">
                  <GraduationCap className="size-3.5" /> A'Pelago alumni
                </span>
              )}
              {s.website && (
                <a href={s.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gold">
                  {s.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <p className="mt-2 text-lg text-ice/80">{s.profile?.summary ?? s.one_liner}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {(s.city || s.country) && (
                <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1"><MapPin className="size-3" /> {[s.city, s.country].filter(Boolean).join(", ")}</span>
              )}
              {s.founded && <span className="rounded-md bg-muted px-2 py-1">Founded {s.founded}</span>}
              {s.stage && <span className="rounded-md bg-muted px-2 py-1">{STAGE_LABELS[s.stage]}</span>}
              {s.sectors.map((x) => <span key={x} className="rounded-md bg-accent px-2 py-1 text-ice">{SECTORS[x]}</span>)}
            </div>
          </div>

          {score ? (
            <div className="glass w-full max-w-sm rounded-3xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Promise · {lensInfo.label}</div>
                  <div className="mt-1 text-6xl font-bold leading-none text-gradient-gold tabular">{Math.round(score.promise)}</div>
                </div>
                <RunAssessmentButton startupId={s.id} lens={lens} rerun />
              </div>
              {score.headline && <p className="mt-3 text-sm leading-snug text-ice/85">{score.headline}</p>}
              {breakdown && (
                <div className="mt-4 space-y-1.5">
                  {(["irl", "thesis_fit", "impact", "momentum", "team"] as const).map((k) => (
                    <div key={k} className="flex items-center gap-2 text-[11px]">
                      <span className="w-20 capitalize text-muted-foreground">{k.replace("_", " ")}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-gold/80" style={{ width: `${Math.round((breakdown[k] ?? 0) * 100)}%` }} />
                      </div>
                      <span className="w-8 text-right tabular text-ice/80">{Math.round((breakdown[k] ?? 0) * 100)}</span>
                    </div>
                  ))}
                </div>
              )}
              {score.programme && (
                <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs">
                  <div className="font-semibold text-gold">Recommended: {PROGRAMMES[score.programme]}</div>
                  {breakdown?.programme_why && <div className="mt-1 text-ice/80">{breakdown.programme_why}</div>}
                </div>
              )}
            </div>
          ) : (
            <div className="glass w-full max-w-sm rounded-3xl p-5">
              <div className="text-sm font-semibold">Not assessed yet</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Run the committee: web research, four readiness assessors, calibrated scoring, matching across investors, grants and partners, and an action plan. Takes about a minute.
              </p>
              <div className="mt-4"><RunAssessmentButton startupId={s.id} lens={lens} /></div>
            </div>
          )}
        </div>
      </section>

      {score && (
        <>
          {/* Readiness */}
          <Section title="Readiness" sub="Analyst agents per framework, cross-checked by a calibrated model">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ReadinessCard framework="trl" a={a.trl} />
              <ReadinessCard framework="brl" a={a.brl} />
              <ReadinessCard framework="oirl" a={a.oirl} />
              <ReadinessCard framework="irl" a={a.irl} />
            </div>
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-3xl p-5">
              <h3 className="text-sm font-semibold">Investment readiness · 10 dimensions</h3>
              {irlDetails?.dimensions && <IrlRadar dimensions={irlDetails.dimensions} />}
              <div className="grid gap-4 text-xs sm:grid-cols-2">
                <div>
                  <div className="mb-1 font-semibold text-impact">Strengths</div>
                  <ul className="space-y-1 text-ice/80">{irlDetails?.strengths?.slice(0, 4).map((x) => <li key={x}>+ {x}</li>)}</ul>
                </div>
                <div>
                  <div className="mb-1 font-semibold text-risk">Risks</div>
                  <ul className="space-y-1 text-ice/80">{irlDetails?.risks?.slice(0, 4).map((x) => <li key={x}>− {x}</li>)}</ul>
                </div>
              </div>
              {irlDetails?.deal_notes && <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-ice/80"><span className="font-semibold text-gold">Check first: </span>{irlDetails.deal_notes}</p>}
            </div>

            <div className="glass rounded-3xl p-5">
              <h3 className="text-sm font-semibold">Ocean impact · Ocean Impact Navigator</h3>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {(Object.keys(IMPACT_AREAS) as ImpactArea[]).map((k) => {
                  const on = impact?.impact_areas?.includes(k);
                  return (
                    <div key={k} className={`rounded-xl border p-2 text-center ${on ? "border-impact/50 bg-impact/15" : "border-border opacity-40"}`}>
                      <div className={`text-lg font-bold ${on ? "text-impact" : ""}`}>{k}</div>
                      <div className="text-[9px] leading-tight text-muted-foreground">{IMPACT_AREAS[k]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <span className="rounded-md bg-muted px-2 py-1">Intensity: <b className="capitalize text-impact">{impact?.intensity ?? "–"}</b></span>
                <span className="rounded-md bg-muted px-2 py-1">Impact–revenue coupling: <b className="text-impact tabular">{impact?.coupling != null ? `${Math.round(impact.coupling * 100)}%` : "–"}</b></span>
              </div>
              <div className="mt-4 space-y-1.5">
                {impact?.kpis?.slice(0, 5).map((k) => (
                  <div key={k.code + k.name} className="flex items-start gap-2 text-xs">
                    <span className="rounded bg-impact/20 px-1.5 py-0.5 font-mono text-[10px] text-impact">{k.code}</span>
                    <span className="text-ice/85">{k.name}{k.estimate && <span className="text-muted-foreground"> — {k.estimate}</span>}</span>
                  </div>
                ))}
              </div>
              {!!impact?.red_flags?.length && (
                <div className="mt-4 rounded-xl border border-risk/30 bg-risk/10 p-3 text-xs">
                  <div className="flex items-center gap-1 font-semibold text-risk"><ShieldAlert className="size-3.5" /> Impact-washing checks</div>
                  <ul className="mt-1 space-y-1 text-ice/80">{impact.red_flags.slice(0, 3).map((x) => <li key={x}>· {x}</li>)}</ul>
                </div>
              )}
            </div>
          </div>

          <Section title="Hidden connections" sub="Warm intro paths, unlocks, consortia and synergies the engine found in the ecosystem graph">
            <ConnectionsPanel connections={d.connections} />
          </Section>

          <Section title="Next best opportunities" sub={`Ranked for the ${lensInfo.label} lens — every match explains why, and what still blocks it`}>
            <Opportunities matches={d.matches} />
          </Section>

          <Section title="Action plan" sub="What the startup and the operator should do next">
            <ActionPlan actions={d.actions} />
          </Section>

          {s.profile && (
            <Section title="Evidence" sub="What the Scout found — every assessment is grounded in these sources">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="glass rounded-2xl p-4 text-xs lg:col-span-2">
                  <ul className="space-y-2">
                    {s.profile.evidence.slice(0, 12).map((e, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-tech">•</span>
                        <span className="text-ice/85">
                          {e.claim}
                          {e.source?.startsWith("http") && (
                            <a href={e.source} target="_blank" rel="noreferrer" className="ml-1 text-muted-foreground hover:text-gold">↗</a>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  {!!s.profile.team?.length && (
                    <div className="glass rounded-2xl p-4 text-xs">
                      <div className="mb-2 flex items-center gap-1.5 font-semibold"><Users className="size-3.5" /> Team</div>
                      {s.profile.team.slice(0, 5).map((t) => <div key={t.name} className="text-ice/85">{t.name} <span className="text-muted-foreground">· {t.role}</span></div>)}
                    </div>
                  )}
                  <div className="glass rounded-2xl p-4 text-xs">
                    <div className="mb-2 font-semibold">Sources ({s.profile.sources.length})</div>
                    <ul className="space-y-1">
                      {s.profile.sources.slice(0, 8).map((u) => (
                        <li key={u} className="truncate"><a href={u} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-gold">{u.replace(/^https?:\/\/(www\.)?/, "")}</a></li>
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

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function DossierSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}
