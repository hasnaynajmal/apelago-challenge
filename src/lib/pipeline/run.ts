// Runs the full "investment committee" for one startup and persists results to Supabase.
// Scout → [TRL, BRL, Ocean Impact, Investment] ∥ Jev calibration → matching → connections → narratives → strategy → scores
import type { ZodType } from "zod";
import { supabaseAdmin } from "../supabase/admin";
import { loadUniverse, type Universe } from "../data";
import { calibrateFits, calibrateReadiness, type LevelEstimate } from "../calibrator/jev";
import { matchAll, stageFromReadiness, type MatchResult, type MatchSet, type StartupSnapshot } from "../engine/matching";
import { findConnections, type Connection } from "../engine/connections";
import { computeIrl, programmeFit, promiseScore, thesisFit, type DimensionScores } from "../engine/scoring";
import type { Stage } from "../taxonomy";
import type { Startup, StartupProfile } from "../types";
import {
  brlAssessor, impactAssessor, investmentAnalyst, MAIN_MODEL, matchNarrator, scoutResearcher, scoutStructurer, strategist, trlAssessor,
} from "@/mastra/agents";
import {
  actionsSchema, impactAssessmentSchema, investmentAssessmentSchema, levelAssessmentSchema, profileSchema, rationaleSchema,
  type ImpactAssessment, type InvestmentAssessment, type LevelAssessment, type ProfileOutput,
} from "@/mastra/schemas";

export interface PipelineEvent {
  step: string;
  agent?: string;
  status: "started" | "progress" | "done" | "error";
  message: string;
  payload?: Record<string, unknown>;
}

export interface PipelineOptions {
  research?: boolean; // force web research even if a profile exists
  onEvent?: (e: PipelineEvent) => void;
  runId?: string; // reuse an existing pipeline_runs row (created by the API route)
}

const TOP_N = 15;
const today = () => new Date().toISOString().slice(0, 10);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function structured<T>(agent: { generate: (p: string, o: object) => Promise<{ object?: unknown }> }, prompt: string, schema: ZodType<T>): Promise<T> {
  const res = await agent.generate(prompt, { structuredOutput: { schema } });
  if (!res.object) throw new Error("No structured output returned");
  return res.object as T;
}

export async function createRun(startupId: string): Promise<string> {
  const { data, error } = await supabaseAdmin().from("pipeline_runs").insert({ startup_id: startupId, current_step: "queued" }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function runPipeline(startupId: string, opts: PipelineOptions = {}) {
  const db = supabaseAdmin();
  const runId = opts.runId ?? (await createRun(startupId));
  const emit = async (e: PipelineEvent) => {
    opts.onEvent?.(e);
    await db.from("pipeline_events").insert({ run_id: runId, ...e });
    if (e.status === "started") await db.from("pipeline_runs").update({ current_step: e.step }).eq("id", runId);
  };

  try {
    const u = await loadUniverse();
    let startup = u.startups.find((s) => s.id === startupId);
    if (!startup) throw new Error(`Unknown startup ${startupId}`);

    // 1. Scout
    let profile = startup.profile;
    if (!profile || opts.research) {
      await emit({ step: "scout", agent: "Scout", status: "started", message: `Researching ${startup.name} on the web` });
      profile = await scout(startup);
      startup = await saveProfile(startup, profile as ProfileOutput);
      await emit({ step: "scout", agent: "Scout", status: "done", message: `Profile built from ${profile.sources.length} sources`, payload: { sources: profile.sources.slice(0, 6) } });
    } else {
      await emit({ step: "scout", agent: "Scout", status: "done", message: "Using stored profile" });
    }
    const pack = evidencePack(startup, profile);

    // 2. Assessors in parallel + calibration
    await emit({ step: "assess", agent: "Committee", status: "started", message: "TRL, BRL, Ocean Impact and Investment assessors working in parallel" });
    const track = <T>(agent: string, p: Promise<T>, msg: (r: T) => string) =>
      p.then(async (r) => { await emit({ step: "assess", agent, status: "progress", message: msg(r) }); return r; });
    const [trl, brl, oirl, inv, jev] = await Promise.all([
      track("TRL Assessor", structured<LevelAssessment>(trlAssessor, `Assess TRL.\n${pack}`, levelAssessmentSchema), (r) => `TRL ${r.level} (confidence ${r.confidence.toFixed(2)})`),
      track("BRL Assessor", structured<LevelAssessment>(brlAssessor, `Assess BRL.\n${pack}`, levelAssessmentSchema), (r) => `BRL ${r.level} (confidence ${r.confidence.toFixed(2)})`),
      track("Ocean Impact Assessor", structured<ImpactAssessment>(impactAssessor, `Assess Ocean Impact Readiness.\n${pack}`, impactAssessmentSchema), (r) => `OIRL ${r.level} · areas ${r.impact_areas.join(", ")}`),
      track("Investment Analyst", structured<InvestmentAssessment>(investmentAnalyst, `Score investment readiness.\n${pack}`, investmentAssessmentSchema), (r) => r.headline),
      track("Calibrator (Jev)", calibrateReadiness(pack), (r) => (r ? `Calibrated distributions from ${r.model}` : "Jev unavailable — using Claude confidence")),
    ]);

    const dims: DimensionScores = Object.fromEntries(Object.entries(inv.dimensions).map(([k, v]) => [k, v.score]));
    const theses = u.theses;
    const defaultThesis = theses.find((t) => t.id === "redstone-blue") ?? theses[0];
    const irl = computeIrl(dims, defaultThesis.config.weights, trl.level);

    // Flag for human review only when Jev is confident and materially disagrees with Claude.
    const reviewFlag = (claude: number, j: LevelEstimate | null | undefined) =>
      !!j && (j.confidence ?? 0) >= 0.5 && (Math.abs(j.level - claude) >= 2 || Math.abs(j.expected - claude) >= 1.5);
    const assessmentRows = [
      levelRow(startupId, "trl", trl, jev?.trl, reviewFlag(trl.level, jev?.trl)),
      levelRow(startupId, "brl", brl, jev?.brl, reviewFlag(brl.level, jev?.brl)),
      {
        ...levelRow(startupId, "oirl", oirl, jev?.oirl, reviewFlag(oirl.level, jev?.oirl)),
        details: { impact_areas: oirl.impact_areas, kpis: oirl.kpis, coupling: oirl.coupling, intensity: oirl.intensity, red_flags: oirl.red_flags },
      },
      {
        startup_id: startupId, framework: "irl", level: irl.level, confidence: irl.coverage,
        distribution: null, calibrator: jev ? "jev" : "claude", rationale: inv.headline,
        evidence: [], gaps: Object.entries(inv.dimensions).filter(([, v]) => v.score == null).map(([k]) => `No evidence for ${k.replace("_", " ")}`),
        next_requirements: inv.risks, needs_review: false, model: MAIN_MODEL,
        details: {
          dimensions: inv.dimensions, jev_dimensions: jev?.irl_dimensions ?? null, gates: irl.gates, avg: irl.avg,
          strengths: inv.strengths, risks: inv.risks, deal_notes: inv.deal_notes, headline: inv.headline,
          by_thesis: Object.fromEntries(theses.map((t) => [t.id, computeIrl(dims, t.config.weights, trl.level).level])),
        },
      },
    ];
    await db.from("assessments").upsert(assessmentRows, { onConflict: "startup_id,framework" });
    const flagged = assessmentRows.filter((r) => r.needs_review).map((r) => r.framework.toUpperCase());
    await emit({
      step: "assess", agent: "Committee", status: "done",
      message: `TRL ${trl.level} · BRL ${brl.level} · OIRL ${oirl.level} · IRL ${irl.level}${flagged.length ? ` — ${flagged.join(", ")} flagged for review (Claude vs Jev disagree)` : ""}`,
      payload: { trl: trl.level, brl: brl.level, oirl: oirl.level, irl: irl.level, needs_review: flagged },
    });

    // 3. Matching
    await emit({ step: "match", agent: "Matchmaker", status: "started", message: `Scanning ${u.investors.length} investors, ${u.funding.length} funding programmes, ${u.partners.length} partners` });
    const profileStage = (profile as ProfileOutput).stage as Stage | null;
    const snap: StartupSnapshot = {
      id: startupId, name: startup.name, country: startup.country, sectors: startup.sectors,
      stage: profileStage ?? stageFromReadiness(trl.level, brl.level),
      trl: trl.level, brl: brl.level, oirl: oirl.level, irl: irl.level,
      raiseEur: profile.raising?.amount_eur ?? null,
    };
    const m = matchAll(snap, u);
    markExisting(m, profile, u);
    await calibrateInvestorFits(m, pack, u);
    await emit({
      step: "match", agent: "Matchmaker", status: "done",
      message: `${m.investors.length} investors · ${m.funding.length} funding · ${m.partners.length} partners matched`,
      payload: { top: { investor: m.investors[0]?.name, funding: m.funding[0]?.name, partner: m.partners[0]?.name } },
    });

    // 4. Hidden connections
    await emit({ step: "connect", agent: "Connector", status: "started", message: "Searching warm paths, consortia, synergies and unlocks" });
    const connections = findConnections(snap, m, u);
    await db.from("connections").delete().eq("startup_id", startupId);
    if (connections.length) {
      await db.from("connections").insert(connections.map((c) => ({ startup_id: startupId, kind: c.kind, title: c.title, narrative: c.narrative, score: c.score, payload: c.payload })));
    }
    await emit({ step: "connect", agent: "Connector", status: "done", message: `${connections.length} connections found`, payload: { titles: connections.slice(0, 4).map((c) => c.title) } });

    // 5. Narratives for top matches
    await emit({ step: "narrate", agent: "Match Narrator", status: "started", message: "Explaining the top matches" });
    const rationales = await narrate(startup, snap, m);
    const matchRows = theses.flatMap((t) =>
      (["investors", "funding", "partners"] as const).flatMap((k) =>
        m[k].slice(0, TOP_N).map((x, i) => ({
          startup_id: startupId, thesis_id: t.id, target_type: x.target_type, target_id: x.target_id,
          fit: x.fit, priority: x.priority, rank: i + 1, status: x.status, reasons: x.reasons, blockers: x.blockers,
          rationale: rationales[`${x.target_type}:${x.target_id}`] ?? null,
          calibrated_fit: (x.components.calibrated as number | undefined) ?? null,
        })),
      ),
    );
    await db.from("matches").delete().eq("startup_id", startupId);
    await db.from("matches").insert(matchRows);
    await emit({ step: "narrate", agent: "Match Narrator", status: "done", message: `${Object.keys(rationales).length} match explanations written` });

    // 6. Strategy
    await emit({ step: "strategy", agent: "Strategist", status: "started", message: "Drafting the action plan" });
    const plan = await structured(strategist, strategyPrompt(startup, snap, { trl, brl, oirl, inv }, m, connections), actionsSchema);
    await db.from("actions").delete().eq("startup_id", startupId);
    await db.from("actions").insert(plan.actions.slice(0, 10).map((a, i) => ({ startup_id: startupId, thesis_id: null, rank: i + 1, ...a })));
    await emit({ step: "strategy", agent: "Strategist", status: "done", message: `${plan.actions.length} next steps`, payload: { first: plan.actions[0]?.title } });

    // 7. Thesis scores
    const scoreRows = theses.map((t) => {
      const fit = thesisFit(snap, t.config);
      const snapT = { ...snap, irl: computeIrl(dims, t.config.weights, trl.level).level };
      const p = promiseScore(snapT, fit, { coupling: oirl.coupling, knownFundingEur: startup!.known_funding_eur, alumnus: startup!.apelago_alumnus, teamDim: dims.team ?? null }, t.config.promise_weights);
      const prog = t.kind === "accelerator" ? programmeFit(snap, startup!.city) : null;
      return {
        startup_id: startupId, thesis_id: t.id, promise: p.promise, thesis_fit: fit.score,
        breakdown: { ...p.breakdown, fit_parts: fit.parts, fit_notes: fit.notes, programme_why: prog?.why ?? null },
        headline: inv.headline, programme: prog?.id ?? null, updated_at: new Date().toISOString(),
      };
    });
    await db.from("scores").upsert(scoreRows, { onConflict: "startup_id,thesis_id" });
    await db.from("startups").update({ stage: snap.stage, updated_at: new Date().toISOString() }).eq("id", startupId);

    await db.from("pipeline_runs").update({ status: "done", current_step: "done", finished_at: new Date().toISOString() }).eq("id", runId);
    await emit({ step: "done", agent: "Committee", status: "done", message: `Assessment complete — promise ${scoreRows.map((s) => `${s.thesis_id}: ${s.promise}`).join(" · ")}` });
    return { runId, snap, scores: scoreRows };
  } catch (e) {
    const message = (e as Error).message;
    await db.from("pipeline_runs").update({ status: "error", error: message, finished_at: new Date().toISOString() }).eq("id", runId);
    await emit({ step: "error", status: "error", message });
    throw e;
  }
}

// ---------- helpers ----------

async function scout(s: Startup): Promise<StartupProfile> {
  const seed = [
    `Name: ${s.name}`, s.website && `Website: ${s.website}`, s.country && `Country: ${s.country}`, s.city && `City: ${s.city}`,
    s.one_liner && `Known description: ${s.one_liner}`, s.source && `Listed in: ${s.source}`,
    s.known_funding_eur && `Known total funding: €${s.known_funding_eur}`,
  ].filter(Boolean).join("\n");
  const research = await scoutResearcher.generate(`Research this startup:\n${seed}`);
  const sources = [...new Set((research.sources ?? []).map((x) => x.payload.url).filter((u): u is string => !!u))];
  const profile = await structured<ProfileOutput>(
    scoutStructurer,
    `Seed facts:\n${seed}\n\nResearch notes:\n${research.text}\n\nSource URLs found: ${sources.join(", ")}`,
    profileSchema,
  );
  profile.sources = [...new Set([...profile.sources, ...sources])];
  return profile as unknown as StartupProfile;
}

async function saveProfile(s: Startup, p: ProfileOutput): Promise<Startup> {
  const patch = {
    profile: p,
    website: s.website ?? p.website,
    country: s.country ?? p.country,
    city: s.city ?? p.city,
    founded: s.founded ?? p.founded,
    sectors: s.sectors?.length ? s.sectors : p.sectors,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin().from("startups").update(patch).eq("id", s.id).select("*").single();
  if (error) throw new Error(error.message);
  return data as Startup;
}

function evidencePack(s: Startup, p: StartupProfile): string {
  return `STARTUP: ${s.name} (${s.country ?? "?"}${s.city ? `, ${s.city}` : ""}) founded ${s.founded ?? "?"}
SECTORS: ${s.sectors.join(", ")}
TODAY: ${today()}
PROFILE (JSON):
${JSON.stringify({ ...p, sources: undefined })}`;
}

function levelRow(startupId: string, framework: string, a: LevelAssessment, j: LevelEstimate | null | undefined, needsReview: boolean) {
  return {
    startup_id: startupId, framework, level: a.level, confidence: a.confidence,
    distribution: j?.distribution ?? null, calibrator: j ? "jev" : "claude",
    rationale: a.rationale, evidence: a.evidence, gaps: a.gaps, next_requirements: a.next_requirements,
    details: j ? { jev_level: j.level, jev_expected: j.expected, jev_confidence: j.confidence } : null,
    needs_review: needsReview, model: MAIN_MODEL,
  };
}

/** Investors/grants already in the cap table → follow-on instead of cold intro. */
function markExisting(m: MatchSet, p: StartupProfile, u: Universe) {
  const history = norm(JSON.stringify(p.funding_history ?? []) + " " + (p.traction ?? []).join(" "));
  const mentions = (name: string) => {
    const key = norm(name.split(/[–(\-]/)[0]);
    return key.length > 3 && history.includes(key);
  };
  for (const x of m.investors) {
    const inv = u.investors.find((i) => i.id === x.target_id)!;
    if (mentions(inv.name)) { x.reasons.unshift("Existing investor — ask for follow-on"); x.priority *= 1.15; }
  }
  for (const x of m.funding) {
    const f = u.funding.find((i) => i.id === x.target_id)!;
    if (mentions(f.name) || (f.id === "fi-raki" && history.includes("raki"))) {
      x.blockers.push("Already received — check eligibility for a second grant");
      x.priority *= 0.6;
    }
  }
  m.investors.sort((a, b) => b.priority - a.priority);
  m.funding.sort((a, b) => b.priority - a.priority);
}

async function calibrateInvestorFits(m: MatchSet, pack: string, u: Universe) {
  const top = m.investors.slice(0, 10);
  const probs = await calibrateFits(
    pack.slice(0, 12_000),
    top.map((x) => {
      const inv = u.investors.find((i) => i.id === x.target_id)!;
      return { id: x.target_id.replace(/[^a-zA-Z0-9_]/g, "_"), question: `Would ${inv.name} plausibly invest in this startup in the next 12 months? Their thesis: ${inv.thesis}` };
    }),
  );
  for (const x of top) {
    const p = probs[x.target_id.replace(/[^a-zA-Z0-9_]/g, "_")];
    if (p == null) continue;
    x.components.calibrated = p;
    x.priority *= 0.75 + 0.5 * p;
  }
  m.investors.sort((a, b) => b.priority - a.priority);
}

async function narrate(s: Startup, snap: StartupSnapshot, m: MatchSet): Promise<Record<string, string>> {
  const pick = (xs: MatchResult[]) => xs.slice(0, 5).map((x) => ({ key: `${x.target_type}:${x.target_id}`, name: x.name, status: x.status, reasons: x.reasons, blockers: x.blockers }));
  const prompt = `Startup: ${s.name} — ${s.one_liner ?? ""} (TRL ${snap.trl}, BRL ${snap.brl}, OIRL ${snap.oirl}, stage ${snap.stage}, ${snap.country ?? "?"})
Explain each match:
${JSON.stringify([...pick(m.investors), ...pick(m.funding), ...pick(m.partners)])}`;
  try {
    const res = await structured(matchNarrator, prompt, rationaleSchema);
    return Object.fromEntries(res.items.map((i) => [i.key, i.rationale]));
  } catch {
    return {};
  }
}

function strategyPrompt(
  s: Startup, snap: StartupSnapshot,
  a: { trl: LevelAssessment; brl: LevelAssessment; oirl: ImpactAssessment; inv: InvestmentAssessment },
  m: MatchSet, connections: Connection[],
) {
  const brief = (xs: MatchResult[]) => xs.slice(0, 6).map((x) => `- ${x.name} [${x.status}] + ${x.reasons.slice(0, 3).join("; ")}${x.blockers.length ? ` − ${x.blockers.join("; ")}` : ""}${x.deadline_date ? ` (deadline ${x.deadline_date})` : ""}`).join("\n");
  return `TODAY: ${today()}
STARTUP: ${s.name} — ${s.one_liner ?? ""} (${s.country ?? "?"}, stage ${snap.stage})
READINESS: TRL ${a.trl.level}, BRL ${a.brl.level}, OIRL ${a.oirl.level}, IRL ${snap.irl}
NEXT-LEVEL REQUIREMENTS: TRL: ${a.trl.next_requirements.join("; ")} | BRL: ${a.brl.next_requirements.join("; ")} | OIRL: ${a.oirl.next_requirements.join("; ")}
KEY GAPS: ${[...a.trl.gaps, ...a.brl.gaps].slice(0, 6).join("; ")}
RISKS: ${a.inv.risks.join("; ")}
TOP INVESTORS:\n${brief(m.investors)}
TOP FUNDING:\n${brief(m.funding)}
TOP PARTNERS:\n${brief(m.partners)}
HIDDEN CONNECTIONS:\n${connections.slice(0, 8).map((c) => `- [${c.kind}] ${c.title}: ${c.narrative}`).join("\n")}
Write the action plan.`;
}
