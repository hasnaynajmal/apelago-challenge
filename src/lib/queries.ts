// Read models for the UI (server-side). Uncached: results change whenever the pipeline runs.
import { supabaseAdmin } from "./supabase/admin";
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
      .filter((m) => m.target) as MatchView[],
    connections: (connections.data ?? []) as ConnectionView[],
    actions: (actions.data ?? []) as ActionView[],
  };
}

export async function getStartupNames(): Promise<{ id: string; name: string }[]> {
  const { data } = await supabaseAdmin().from("startups").select("id,name").order("name");
  return data ?? [];
}
