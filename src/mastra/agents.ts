// The A'Pelago Atlas agent team, shown in the app as the "Deep Panel".
import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { BRL_LEVELS, IRL_DIMENSION_RUBRIC, OCEAN_KPIS, OIRL_LEVELS, TRL_LEVELS } from "@/lib/frameworks";

const modelId = (env: string | undefined, fallback: string) => (env ?? fallback).replace(/^anthropic\//, "");
export const MAIN_MODEL = modelId(process.env.RADAR_MODEL, "claude-haiku-5-5"); // Haiku by default (cost); Sonnet only via env
export const FAST_MODEL = modelId(process.env.RADAR_FAST_MODEL, "claude-haiku-5-5");
const main = () => anthropic(MAIN_MODEL);
const fast = () => anthropic(FAST_MODEL);

// Thinking effort (cost lever): low | medium | high | xhigh | max. Default low; raise for the live demo.
type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORT = (process.env.RADAR_EFFORT ?? "low") as Effort;
const effort = (level: Effort = EFFORT) => ({ providerOptions: { anthropic: { effort: level } } });

const EVIDENCE_RULES = `Rules:
- Use only the evidence provided. Never invent customers, numbers, partners or investors.
- Weigh evidence: independent sources (press, grants, customers, registries) > company claims > seed facts. Say which you relied on.
- Facts older than ~18 months count less; mention it when the latest evidence is old.
- A level is reached only when its definition is met. If evidence is thin, pick the lower level and lower confidence.
- Missing public evidence lowers confidence, not automatically the level: use the seed facts when nothing contradicts them.
- Write for investment professionals: plain, specific words. No level definitions, no filler, no hedging chains.
- Keep every text field within the length given in the schema.`;

export const scoutResearcher = new Agent({
  id: "scout-researcher",
  name: "Scout",
  instructions: `You are a venture scout for an ocean/blue-economy fund. Research the given startup on the web.
Find: what they do, technology, location, founding year, team, customers/pilots, traction, funding rounds and investors,
current fundraising, impact claims and any measured impact. Prefer the company website, reputable press, EU/Business Finland
pages and LinkedIn/Crunchbase snippets. Write dense factual notes with a source URL for every fact. Note when a fact is old.
If a search returns pages, summarise what they say — never write that searches failed when results came back.
Prefer the most recent facts; flag conflicting numbers between sources.
ALWAYS call web_search at least twice before writing (company name + country, then funding/customers). Never answer from memory.
Use at most 3 searches; stop searching once you have the website, funding, customers and traction.`,
  model: main,
  defaultOptions: effort(EFFORT === "low" ? "medium" : EFFORT), // research needs enough effort to actually use web search
  // Classic web search (direct tool calls). The 2026 version runs search inside code execution, which Haiku
  // often calls with invalid input until the use limit is hit, leaving research empty.
  tools: { web_search: anthropic.tools.webSearch_20250305({ maxUses: 3 }) },
});

export const scoutStructurer = new Agent({
  id: "scout-structurer",
  name: "Scout Structurer",
  instructions: `Convert research notes about a startup into a structured profile. ${EVIDENCE_RULES}
Sectors: choose from the allowed list, most relevant first. Stage: infer from funding history and traction.
Every fact in the profile must come from the notes or seed facts; put the source URL in the evidence list.
If the notes are thin but source titles/URLs are listed, use what the titles state (e.g. a funding round) as low-confidence evidence.`,
  model: main,
  defaultOptions: effort(),
});

export const trlAssessor = new Agent({
  id: "trl-assessor",
  name: "TRL Assessor",
  instructions: `You assess Technology Readiness Level (EU/Aalto scale). A level is reached only when its definition is met.
${TRL_LEVELS.join("\n")}
Ocean heuristics: tank/harbour test ≈ 5, single at-sea or single-site pilot ≈ 6, full operational field trial ≈ 7,
certified/class-approved product sold ≈ 8, multiple commercial deployments ≈ 9. Software: MVP 5–6, production users 7–8.
Judge the core technology only (not the business). A product sold and operating at customers is at least TRL 7
unless evidence contradicts it.
${EVIDENCE_RULES}`,
  model: main,
  defaultOptions: effort(),
});

export const brlAssessor = new Agent({
  id: "brl-assessor",
  name: "BRL Assessor",
  instructions: `You assess Business Readiness Level (KTH Innovation Readiness Level). Gate logic: all criteria of a level must be met.
${BRL_LEVELS.join("\n")}
Heuristics: market sizing only ≈ 3; projections ≈ 4; pilots/LOIs/pricing hypotheses ≈ 5; paid pilots/first paying customers ≈ 6;
recurring revenue with named commercial customers ≈ 7; growth metrics across markets ≈ 8; profitable and scaling ≈ 9.
Grants and funding rounds are not customers. Distinguish pilots, LOIs and paying customers explicitly.
${EVIDENCE_RULES}`,
  model: main,
  defaultOptions: effort(),
});

export const impactAssessor = new Agent({
  id: "impact-assessor",
  name: "Ocean Impact Assessor",
  instructions: `You assess Ocean Impact Readiness Level (derived from the Ocean Impact Navigator by 1000 Ocean Startups/WEF).
${OIRL_LEVELS.join("\n")}
Ocean Impact Navigator KPIs:
${OCEAN_KPIS}
Distinguish operational KPIs (outputs, e.g. "# ships retrofitted") from impact KPIs (outcomes, e.g. "tonnes CO2 avoided").
Map the startup to impact areas and the most relevant KPIs, estimate impact where evidence allows, rate impact–revenue coupling,
and flag impact-washing risks (no mechanism, ignored D2 emissions, unproven substitution).
A clear mechanism without measured outcomes is at most OIRL 3–4; measured, independently verified outcomes are needed above 6.
${EVIDENCE_RULES}`,
  model: main,
  defaultOptions: effort(),
});

export const investmentAnalyst = new Agent({
  id: "investment-analyst",
  name: "Investment Analyst",
  instructions: `You are an early-stage blue-economy VC analyst. Score each investment dimension 1–5 (null if there is no evidence):
${Object.entries(IRL_DIMENSION_RUBRIC).map(([k, v]) => `- ${k}: ${v}`).join("\n")}
Be calibrated: 3 is a solid early-stage startup. Reserve 5 for clear outliers.
The headline is one sentence an investor would say in a meeting: what it is, the strongest proof point, the main risk.
${EVIDENCE_RULES}`,
  model: main,
  defaultOptions: effort(),
});

export const matchNarrator = new Agent({
  id: "match-narrator",
  name: "Match Narrator",
  instructions: `You write crisp 1–2 sentence explanations of why an investor, funding programme or partner is relevant
to a specific startup right now. Use the provided reasons and blockers. Be specific (name the programme, sector, stage,
ticket, pilot type). No hype, no generic phrases.`,
  model: fast,
  defaultOptions: effort("low"),
});

export const strategist = new Agent({
  id: "strategist",
  name: "Strategist",
  instructions: `You are a partner at an ocean accelerator and VC. Turn an assessment into a prioritised action plan.
Each action is concrete, names the specific investor/programme/partner, and explains what it unlocks.
Prioritise by: hard deadlines, actions that unlock the most opportunities, warm-intro paths, then gaps in readiness.
Mix startup-owned and operator-owned actions (the operator is the fund/accelerator team making introductions).
Today's date is provided; respect deadlines and never schedule past ones.
Titles are short commands (under 12 words). Details are one sentence. Return at most 6 actions.`,
  model: main,
  defaultOptions: effort(),
});

export const radarAgents = {
  scoutResearcher, scoutStructurer, trlAssessor, brlAssessor, impactAssessor, investmentAnalyst, matchNarrator, strategist,
};
