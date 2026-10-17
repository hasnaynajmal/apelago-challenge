// Read models for the UI (server-side). Uncached: results change whenever the pipeline runs.
import { quadrantOf, type Quadrant } from "./quadrant";
import { supabaseAdmin } from "./supabase/admin";
import { INVESTOR_FRAMING, type LensId } from "./lens";

// The lens owner (e.g. Redstone under its own VC lens) is never shown as an investor match.
const ownerOf = (lens: string) => INVESTOR_FRAMING[lens as LensId]?.ownerId ?? null;
import type { Framework, Sector, Stage } from "./taxonomy";
import type { Assessment, Funding, Investor, Partner, Startup } from "./types";

export interface RadarItem {
  id: string;
  name: string;
  oneLiner: string | null;
  country: string | null;
  sectors: Sector[];
  stage: Stage | null;
  alumnus: boolean;
  assessed: boolean;
  promise: number | null;
  thesisFit: number | null;
  programme: string | null;
  headline: string | null;
  levels: Partial<Record<Framework, number>>;
  needsReview: boolean;
  topMatch: string | null;
}

export async function getRadar(lens: string): Promise<RadarItem[]> {
  const db = supabaseAdmin();
  const [startups, scores, assessments, matches] = await Promise.all([
    db.from("startups").select("id,name,one_liner,country,sectors,stage,apelago_alumnus"),
    db.from("scores").select("startup_id,promise,thesis_fit,programme,headline").eq("thesis_id", lens),
    db.from("assessments").select("startup_id,framework,level,needs_review"),
    db.from("matches").select("startup_id,target_type,target_id,rank").eq("thesis_id", lens).eq("target_type", "investor").eq("rank", 1),
  ]);
  const investorIds = [...new Set((matches.data ?? []).map((m) => m.target_id as string))];
  const investors = investorIds.length
    ? (await db.from("investors").select("id,name").in("id", investorIds)).data ?? []
    : [];

  return (startups.data ?? [])
    .map((s) => {
      const score = scores.data?.find((x) => x.startup_id === s.id);
      const own = (assessments.data ?? []).filter((a) => a.startup_id === s.id);
      const top = matches.data?.find((m) => m.startup_id === s.id);
      return {
        id: s.id,
        name: s.name,
        oneLiner: s.one_liner,
        country: s.country,
        sectors: s.sectors as Sector[],
        stage: s.stage as Stage | null,
        alumnus: s.apelago_alumnus,
        assessed: !!score,
        promise: score?.promise ?? null,
        thesisFit: score?.thesis_fit ?? null,
        programme: score?.programme ?? null,
        headline: score?.headline ?? null,
        levels: Object.fromEntries(own.map((a) => [a.framework, a.level])) as Partial<Record<Framework, number>>,
        needsReview: own.some((a) => a.needs_review),
        topMatch: investors.find((i) => i.id === top?.target_id)?.name ?? null,
      } satisfies RadarItem;
    })
    .sort((a, b) => (b.promise ?? -1) - (a.promise ?? -1));
}

export interface MatchView {
  targetType: "investor" | "funding" | "partner";
  targetId: string;
  rank: number;
  fit: number;
  priority: number;
  status: "ready" | "stretch" | "after_milestone";
  reasons: string[];
  blockers: string[];
  rationale: string | null;
  calibratedFit: number | null;
  target: Investor | Funding | Partner;
}

export interface ConnectionView {
  kind: "warm_path" | "consortium" | "synergy" | "unlock" | "deadline";
  title: string;
  narrative: string | null;
  score: number | null;
  payload: Record<string, unknown>;
}

export interface ActionView {
  horizon: "now" | "30d" | "90d";
  title: string;
  detail: string | null;
  owner: "startup" | "operator";
  unlocks: string[];
  deadline_date: string | null;
  rank: number;
}

export interface Dossier {
  startup: Startup;
  assessments: Partial<Record<Framework, Assessment>>;
  score: { promise: number; thesis_fit: number; breakdown: Record<string, unknown>; headline: string | null; programme: string | null } | null;
  matches: MatchView[];
  connections: ConnectionView[];
  actions: ActionView[];
}

export async function getDossier(id: string, lens: string): Promise<Dossier | null> {
  const db = supabaseAdmin();
  const { data: startup } = await db.from("startups").select("*").eq("id", id).maybeSingle();
  if (!startup) return null;
  const [assessments, score, matches, connections, actions, investors, funding, partners] = await Promise.all([
    db.from("assessments").select("*").eq("startup_id", id),
    db.from("scores").select("*").eq("startup_id", id).eq("thesis_id", lens).maybeSingle(),
    db.from("matches").select("*").eq("startup_id", id).eq("thesis_id", lens).order("rank"),
    db.from("connections").select("*").eq("startup_id", id).order("score", { ascending: false }),
    db.from("actions").select("*").eq("startup_id", id).order("rank"),
    db.from("investors").select("*"),
    db.from("funding").select("*"),
    db.from("partners").select("*"),
  ]);
  const lookup = {
    investor: new Map((investors.data ?? []).map((x) => [x.id, x])),
    funding: new Map((funding.data ?? []).map((x) => [x.id, x])),
    partner: new Map((partners.data ?? []).map((x) => [x.id, x])),
  };
  return {
    startup: startup as Startup,
    assessments: Object.fromEntries((assessments.data ?? []).map((a) => [a.framework, a])) as Dossier["assessments"],
    score: score.data ?? null,
    matches: (matches.data ?? [])
      .map((m) => ({
        targetType: m.target_type, targetId: m.target_id, rank: m.rank, fit: m.fit, priority: m.priority, status: m.status,
        reasons: m.reasons, blockers: m.blockers, rationale: m.rationale, calibratedFit: m.calibrated_fit,
        target: lookup[m.target_type as "investor" | "funding" | "partner"].get(m.target_id),
      }))
      .filter((m) => m.target && !(m.targetType === "investor" && m.targetId === ownerOf(lens))) as MatchView[],
    connections: (connections.data ?? []) as ConnectionView[],
    actions: (actions.data ?? []) as ActionView[],
  };
}

// ---------- Pipeline (home) ----------

export type { Quadrant } from "./quadrant";

export interface PipelineRow extends RadarItem {
  readiness: number | null; // mean of TRL, BRL, IRL
  quadrant: Quadrant | null;
  topInvestor: { name: string; fit: number } | null;
  topFunding: { name: string; deadline: string | null } | null;
  topPartner: { name: string } | null;
  nextStep: { title: string; owner: string } | null;
}

export async function getPipeline(lens: string): Promise<PipelineRow[]> {
  const db = supabaseAdmin();
  const [base, matches, actions, investors, funding, partners] = await Promise.all([
    getRadar(lens),
    db.from("matches").select("startup_id,target_type,target_id,fit,rank").eq("thesis_id", lens).lte("rank", 2).order("rank"),
    db.from("actions").select("startup_id,title,owner,rank").eq("rank", 1),
    db.from("investors").select("id,name"),
    db.from("funding").select("id,name,deadline_date"),
    db.from("partners").select("id,name"),
  ]);
  const name = (list: { id: string; name: string }[] | null, id?: string) => list?.find((x) => x.id === id)?.name ?? null;
  return base.map((r) => {
    const levels = [r.levels.trl, r.levels.brl, r.levels.irl].filter((x): x is number => x != null);
    const readiness = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : null;
    const owner = ownerOf(lens);
    const m = (t: string) => matches.data?.find((x) => x.startup_id === r.id && x.target_type === t && !(t === "investor" && x.target_id === owner));
    const inv = m("investor");
    const fun = m("funding");
    const par = m("partner");
    const act = actions.data?.find((x) => x.startup_id === r.id);
    const fundRow = funding.data?.find((x) => x.id === fun?.target_id);
    return {
      ...r,
      readiness,
      quadrant: readiness != null && r.thesisFit != null ? quadrantOf(readiness, r.thesisFit) : null,
      topInvestor: inv ? { name: name(investors.data, inv.target_id) ?? inv.target_id, fit: inv.fit } : null,
      topFunding: fundRow ? { name: fundRow.name, deadline: fundRow.deadline_date } : null,
      topPartner: par ? { name: name(partners.data, par.target_id) ?? par.target_id } : null,
      nextStep: act ? { title: act.title, owner: act.owner } : null,
    };
  });
}

export interface DeadlineRow {
  id: string;
  name: string;
  provider: string | null;
  date: string;
  days: number;
  amount: number | null;
  eligible: { id: string; name: string; status: string }[];
}

/** Upcoming funding deadlines across the whole portfolio, with the ventures that match each call. */
export async function getDeadlines(lens: string, horizonDays = 120): Promise<DeadlineRow[]> {
  const db = supabaseAdmin();
  const today = new Date();
  const until = new Date(today.getTime() + horizonDays * 86_400_000).toISOString().slice(0, 10);
  const { data: calls } = await db
    .from("funding").select("id,name,provider,deadline_date,amount_max_eur")
    .gte("deadline_date", today.toISOString().slice(0, 10)).lte("deadline_date", until).order("deadline_date");
  if (!calls?.length) return [];
  const [{ data: m }, { data: s }] = await Promise.all([
    db.from("matches").select("startup_id,target_id,status,fit").eq("thesis_id", lens).eq("target_type", "funding").in("target_id", calls.map((c) => c.id)),
    db.from("startups").select("id,name"),
  ]);
  return calls.map((c) => ({
    id: c.id,
    name: c.name,
    provider: c.provider,
    date: c.deadline_date,
    days: Math.round((new Date(c.deadline_date).getTime() - today.getTime()) / 86_400_000),
    amount: c.amount_max_eur,
    eligible: (m ?? [])
      .filter((x) => x.target_id === c.id)
      .sort((a, b) => b.fit - a.fit)
      .map((x) => ({ id: x.startup_id, name: s?.find((y) => y.id === x.startup_id)?.name ?? x.startup_id, status: x.status })),
  }));
}

export interface InvestorDemand {
  id: string;
  name: string;
  hq: string | null;
  isPartner: boolean;
  ventures: { id: string; name: string }[];
}

/** Investors that appear most often among ventures' top-3 investor matches — the relationships worth activating first. */
export async function getInvestorDemand(lens: string, limit = 5): Promise<InvestorDemand[]> {
  const db = supabaseAdmin();
  const [{ data: m }, { data: inv }, { data: s }] = await Promise.all([
    db.from("matches").select("startup_id,target_id").eq("thesis_id", lens).eq("target_type", "investor").lte("rank", 3),
    db.from("investors").select("id,name,hq,is_challenge_partner"),
    db.from("startups").select("id,name"),
  ]);
  const by = new Map<string, string[]>();
  for (const r of m ?? []) if (r.target_id !== ownerOf(lens)) by.set(r.target_id, [...(by.get(r.target_id) ?? []), r.startup_id]);
  return [...by.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, limit)
    .map(([id, ventures]) => {
      const i = inv?.find((x) => x.id === id);
      return {
        id,
        name: (i?.name ?? id).replace(/\s*\(.*\)$/, ""),
        hq: i?.hq ?? null,
        isPartner: !!i?.is_challenge_partner,
        ventures: ventures.map((v) => ({ id: v, name: s?.find((x) => x.id === v)?.name ?? v })),
      };
    });
}

export interface WarmPathView {
  startupId: string;
  startupName: string;
  investorId: string;
  hops: string[];
  score: number;
}

/** Strongest warm-intro paths across the portfolio (excluding paths into the lens owner itself). */
export async function getWarmPaths(lens: string, limit = 3): Promise<WarmPathView[]> {
  const db = supabaseAdmin();
  const [{ data: c }, { data: s }] = await Promise.all([
    db.from("connections").select("startup_id,payload,score").eq("kind", "warm_path").order("score", { ascending: false }).limit(40),
    db.from("startups").select("id,name"),
  ]);
  const owner = ownerOf(lens);
  const seen = new Set<string>();
  const out: WarmPathView[] = [];
  for (const r of c ?? []) {
    const p = r.payload as { investor_id: string; hops: { name: string }[] };
    if (p.investor_id === owner || seen.has(r.startup_id)) continue;
    seen.add(r.startup_id);
    out.push({
      startupId: r.startup_id,
      startupName: s?.find((x) => x.id === r.startup_id)?.name ?? r.startup_id,
      investorId: p.investor_id,
      hops: p.hops.map((h) => h.name),
      score: r.score,
    });
    if (out.length >= limit) break;
  }
  return out;
}

export async function getStartupNames(): Promise<{ id: string; name: string }[]> {
  const { data } = await supabaseAdmin().from("startups").select("id,name").order("name");
  return data ?? [];
}
