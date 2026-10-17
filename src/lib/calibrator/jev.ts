// Jev (TypeSafe AI "System One") — calibrated probabilities for readiness levels and fit questions.
// Accessed via Vercel AI Gateway (or directly with TYPESAFE_API_KEY). Returns null on any failure so callers fall back to Claude.
import { BRL_LEVELS, IRL_DIMENSION_RUBRIC, OIRL_LEVELS, TRL_LEVELS } from "../frameworks";

type Question =
  | { type: "score"; instructions: string; criteria: string[] }
  | { type: "noul"; instructions: string; criteria?: { true?: string; false?: string } }
  | { type: "choice"; instructions: string; criteria: Record<string, string | null> };

interface ScoreAnswer { type: "score"; score: number; confidence: number; probabilities: Record<string, number> }
interface NoulAnswer { type: "noul"; noul: number }
type Answer = ScoreAnswer | NoulAnswer;

export interface LevelEstimate {
  level: number; // 1-based argmax
  expected: number; // 1-based expected level
  confidence: number;
  distribution: Record<string, number>; // 1-based level → probability
}

function endpoint() {
  if (process.env.TYPESAFE_API_KEY) return { url: "https://api.typesafe.ai/v1/systemone", key: process.env.TYPESAFE_API_KEY, model: "jev-latest" };
  if (process.env.AI_GATEWAY_API_KEY) return { url: "https://ai-gateway.vercel.sh/typesafe/v1/systemone", key: process.env.AI_GATEWAY_API_KEY, model: "jev" };
  return null;
}

async function ask(state: unknown, questions: Record<string, Question>): Promise<{ model: string; answers: Record<string, Answer> } | null> {
  const ep = endpoint();
  if (!ep) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(ep.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${ep.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: ep.model, state, questions }),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 429 || res.status === 529) {
        await new Promise((r) => setTimeout(r, 1000 * (Number(res.headers.get("retry-after")) || 1)));
        continue;
      }
      if (!res.ok) {
        console.warn(`[jev] HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
        return null;
      }
      return await res.json();
    } catch (e) {
      console.warn(`[jev] ${(e as Error).message}`);
    }
  }
  return null;
}

function toLevel(a: Answer | undefined): LevelEstimate | null {
  if (!a || a.type !== "score") return null;
  const distribution: Record<string, number> = {};
  let best = 0;
  let bestP = -1;
  for (const [k, p] of Object.entries(a.probabilities)) {
    const level = Number(k) + 1; // Jev keys are 0-indexed
    distribution[level] = p;
    if (p > bestP) { bestP = p; best = level; }
  }
  return { level: best, expected: a.score + 1, confidence: a.confidence, distribution };
}

export interface CalibratedReadiness {
  model: string;
  trl: LevelEstimate | null;
  brl: LevelEstimate | null;
  oirl: LevelEstimate | null;
  irl_dimensions: Record<string, LevelEstimate | null>;
}

/** One Jev request scoring TRL, BRL, OIRL (9 levels) and the 10 investment dimensions (5 levels) from an evidence pack. */
export async function calibrateReadiness(evidencePack: unknown): Promise<CalibratedReadiness | null> {
  const questions: Record<string, Question> = {
    trl: { type: "score", instructions: "Technology Readiness Level of the startup's core technology (EU/Aalto scale).", criteria: TRL_LEVELS },
    brl: { type: "score", instructions: "Business Readiness Level (KTH scale) of the startup.", criteria: BRL_LEVELS },
    oirl: { type: "score", instructions: "Ocean Impact Readiness Level: maturity of the startup's ocean impact evidence.", criteria: OIRL_LEVELS },
  };
  for (const [dim, rubric] of Object.entries(IRL_DIMENSION_RUBRIC)) {
    const [l1, l3, l5] = rubric.split(" · ").map((x) => x.replace(/^\d\s/, ""));
    questions[`irl_${dim}`] = {
      type: "score",
      instructions: `Investment readiness — ${dim.replace("_", " ")} dimension.`,
      criteria: [`1: ${l1}`, "2: between 1 and 3", `3: ${l3}`, "4: between 3 and 5", `5: ${l5}`],
    };
  }
  const r = await ask(evidencePack, questions);
  if (!r) return null;
  const irl_dimensions: Record<string, LevelEstimate | null> = {};
  for (const dim of Object.keys(IRL_DIMENSION_RUBRIC)) irl_dimensions[dim] = toLevel(r.answers[`irl_${dim}`]);
  return { model: r.model, trl: toLevel(r.answers.trl), brl: toLevel(r.answers.brl), oirl: toLevel(r.answers.oirl), irl_dimensions };
}

/** Calibrated yes-probabilities for a batch of fit questions (e.g. "Does X fit investor Y's thesis?"). */
export async function calibrateFits(state: unknown, items: { id: string; question: string; yes?: string; no?: string }[]) {
  if (!items.length) return {} as Record<string, number>;
  const questions: Record<string, Question> = {};
  for (const it of items) {
    questions[it.id] = { type: "noul", instructions: it.question, ...(it.yes || it.no ? { criteria: { true: it.yes, false: it.no } } : {}) };
  }
  const r = await ask(state, questions);
  const out: Record<string, number> = {};
  if (!r) return out;
  for (const it of items) {
    const a = r.answers[it.id];
    if (a?.type === "noul") out[it.id] = a.noul;
  }
  return out;
}
