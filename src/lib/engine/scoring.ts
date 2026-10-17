// Readiness aggregation and thesis-specific scoring. Pure functions — every number has a breakdown.
import { IRL_DIMENSIONS, STAGE_LABELS, type IrlDimension, type Sector } from "../taxonomy";
import type { ThesisConfig } from "../types";
import { geoFit, stageFit, type StartupSnapshot } from "./matching";

export type DimensionScores = Partial<Record<IrlDimension, number | null>>; // 1..5, null = unknown

/** Weighted 10-dimension score → Investment Readiness Level 1–9, with gates. Unknown dimensions are skipped. */
export function computeIrl(dims: DimensionScores, weights: Record<string, number>, trl: number) {
  let sum = 0;
  let wsum = 0;
  for (const d of Object.keys(IRL_DIMENSIONS) as IrlDimension[]) {
    const v = dims[d];
    if (v == null) continue;
    const w = weights[d] ?? 1;
    sum += v * w;
    wsum += w;
  }
  const avg = wsum ? sum / wsum : 1;
  let level = Math.round(1 + (avg - 1) * 2);
  const gates: string[] = [];
  if ((dims.team ?? 5) <= 2 && level > 4) { level = 4; gates.push("Team gap caps IRL at 4"); }
  if ((dims.tech ?? 5) <= 2 && trl <= 3 && level > 4) { level = 4; gates.push("Unproven tech caps IRL at 4"); }
  const known = Object.values(dims).filter((v) => v != null).length;
  return { level: Math.max(1, Math.min(9, level)), avg, gates, coverage: known / 10 };
}

export interface ThesisFit {
  score: number; // 0..1
  parts: { sector: number; stage: number; geo: number; impact: number };
  notes: string[];
}

export function thesisFit(s: StartupSnapshot, t: ThesisConfig): ThesisFit {
  const notes: string[] = [];
  const primary = s.sectors[0] as Sector | undefined;
  let sector = 0.1;
  if (primary && t.sectors.includes(primary)) { sector = 1; notes.push("Core sector for this thesis"); }
  else if (s.sectors.some((x) => t.sectors.includes(x))) { sector = 0.8; notes.push("Secondary sector in thesis"); }
  else if (s.sectors.some((x) => t.adjacent_sectors.includes(x))) { sector = 0.5; notes.push("Adjacent sector"); }
  else notes.push("Outside thesis sectors");

  const st = stageFit(s.stage, t.stages);
  const stage = st.score;
  if (st.distance === 0) notes.push(`${STAGE_LABELS[s.stage]} is in mandate`);
  else notes.push(`${STAGE_LABELS[s.stage]} is outside core stages`);

  const geo = geoFit(s.country, t.geographies).score || 0.2;
  let impact = 1;
  if (t.impact_required) {
    impact = s.oirl >= 5 ? 1 : s.oirl >= 3 ? 0.7 : 0.3;
    if (s.oirl < 3) notes.push("Impact case too weak for an impact mandate");
  }
  const score = 0.4 * sector + 0.25 * stage + 0.15 * geo + 0.2 * impact;
  return { score, parts: { sector, stage, geo, impact }, notes };
}

export interface PromiseScore {
  promise: number; // 0..100
  breakdown: { irl: number; thesis_fit: number; impact: number; momentum: number; team: number };
}

export function promiseScore(
  s: StartupSnapshot,
  fit: ThesisFit,
  extras: { coupling: number; knownFundingEur: number | null; alumnus: boolean; teamDim: number | null },
  weights: ThesisConfig["promise_weights"],
): PromiseScore {
  const irl = (s.irl - 1) / 8;
  const impact = Math.min(1, ((s.oirl - 1) / 8) * 0.7 + extras.coupling * 0.3);
  const funding = extras.knownFundingEur ? Math.min(1, Math.log10(extras.knownFundingEur / 100_000) / 2.5) : 0.2;
  const momentum = Math.min(1, Math.max(0, funding) + (extras.alumnus ? 0.15 : 0));
  const team = extras.teamDim ? (extras.teamDim - 1) / 4 : 0.4;
  const b = { irl, thesis_fit: fit.score, impact, momentum, team };
  const promise =
    100 *
    (weights.irl * b.irl + weights.thesis_fit * b.thesis_fit + weights.impact * b.impact + weights.momentum * b.momentum + weights.team * b.team);
  return { promise: Math.round(promise * 10) / 10, breakdown: b };
}

/** A'Pelago programme recommendation from readiness and location. */
export function programmeFit(s: StartupSnapshot, city: string | null): { id: string; why: string } {
  if (s.trl <= 4 && s.brl <= 2) return { id: "lab2impact", why: `Research-stage (TRL ${s.trl}, BRL ${s.brl}) — Lab2Impact turns research into a venture` };
  if (s.brl >= 7) return { id: "northern-blue", why: `BRL ${s.brl} scale-up — Northern Blue's 5-month international programme` };
  if (city && /helsinki|espoo|vantaa/i.test(city)) return { id: "helsinki-studio", why: "Helsinki-region company — Blue Economy Studio connects to Helsinki's maritime corporates" };
  if (s.brl >= 4) return { id: "noca", why: `BRL ${s.brl} — NOCA's Nordic market sprint to land first Nordic customers` };
  return { id: "lab2impact", why: "Early commercial stage — start with Lab2Impact validation" };
}
