// Deterministic, explainable matching of a startup against investors, funding and partners.
// Every score is decomposed into reasons (why it fits) and blockers (what stands in the way).
import { REGION_GROUPS, SECTORS, STAGES, STAGE_LABELS, type Sector, type Stage } from "../taxonomy";
import type { Funding, Investor, MatchTarget, Partner } from "../types";

export interface StartupSnapshot {
  id: string;
  name: string;
  country: string | null;
  sectors: Sector[];
  stage: Stage;
  trl: number;
  brl: number;
  oirl: number;
  irl: number;
  raiseEur?: number | null;
}

export interface MatchResult {
  target_type: MatchTarget;
  target_id: string;
  name: string;
  fit: number; // 0..1
  priority: number; // fit × feasibility × urgency × value
  status: "ready" | "stretch" | "after_milestone";
  reasons: string[];
  blockers: string[];
  components: Record<string, number>;
  deadline_date?: string | null;
  amount_eur?: number | null;
}

const EUROPE = new Set([...REGION_GROUPS.EU, ...REGION_GROUPS.EEA, "GB", "CH", "MC", "UA", "NO", "IS"]);
const STAGE_TYPICAL_RAISE: Record<Stage, number> = {
  research: 150_000, pre_seed: 500_000, seed: 1_500_000, series_a: 5_000_000, series_b_plus: 15_000_000, growth: 30_000_000,
};
const sectorLabel = (s: string) => SECTORS[s as Sector] ?? s;
const eur = (n: number) => (n >= 1_000_000 ? `€${+(n / 1_000_000).toFixed(1)}M` : `€${Math.round(n / 1000)}k`);
const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));

export function stageFromReadiness(trl: number, brl: number): Stage {
  if (trl <= 3 && brl <= 2) return "research";
  if (brl <= 3) return "pre_seed";
  if (brl <= 5) return "seed";
  if (brl <= 7) return "series_a";
  if (brl === 8) return "series_b_plus";
  return "growth";
}

export function geoFit(country: string | null, tokens: string[]): { score: number; label?: string } {
  if (!tokens.length || tokens.includes("global")) return { score: 1, label: "Invests globally" };
  if (!country) return { score: 0.5 };
  if (tokens.includes(country)) return { score: 1, label: `Active in ${country}` };
  for (const t of tokens) {
    if (REGION_GROUPS[t]?.includes(country)) return { score: 1, label: `${t.replace("_", " ")} focus covers ${country}` };
  }
  if (tokens.includes("europe") && EUROPE.has(country)) return { score: 0.9, label: "European mandate" };
  return { score: 0 };
}

export function sectorFit(startupSectors: Sector[], targetSectors: string[]): { score: number; matched: string[] } {
  if (targetSectors.includes("*")) return { score: 0.6, matched: [] };
  if (targetSectors.includes("*blue")) return { score: 0.8, matched: [] };
  const matched = startupSectors.filter((s) => targetSectors.includes(s));
  if (!matched.length) return { score: 0, matched };
  const primaryBonus = targetSectors.includes(startupSectors[0]) ? 0.25 : 0;
  return { score: clamp(matched.length / startupSectors.length + primaryBonus), matched };
}

export function stageFit(stage: Stage, stages: Stage[]): { score: number; distance: number } {
  if (!stages.length) return { score: 0.7, distance: 0 };
  const i = STAGES.indexOf(stage);
  const distance = Math.min(...stages.map((s) => Math.abs(STAGES.indexOf(s) - i)));
  return { score: distance === 0 ? 1 : distance === 1 ? 0.5 : 0, distance };
}

function urgency(deadline: string | null | undefined, now: Date): number {
  if (!deadline) return 1;
  const days = (new Date(deadline).getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return 0;
  return days <= 60 ? 1.2 : 1;
}

// ---------- Investors ----------
export function matchInvestor(s: StartupSnapshot, inv: Investor): MatchResult | null {
  const reasons: string[] = [];
  const blockers: string[] = [];

  const sec = sectorFit(s.sectors, inv.sectors);
  if (sec.score === 0) return null;
  if (sec.matched.length) reasons.push(`Sector: ${sec.matched.map(sectorLabel).join(", ")}`);

  const stg = stageFit(s.stage, inv.stages);
  if (stg.distance >= 2) return null;
  if (stg.distance === 0) reasons.push(`Invests at ${STAGE_LABELS[s.stage]}`);
  else blockers.push(`Usually ${inv.stages.map((x) => STAGE_LABELS[x]).join("/")} — you're ${STAGE_LABELS[s.stage]}`);

  const geo = geoFit(s.country, inv.region_focus);
  if (geo.score === 0) return null;
  if (geo.label) reasons.push(geo.label);

  const need = s.raiseEur ?? STAGE_TYPICAL_RAISE[s.stage];
  let ticket = 0.6;
  if (inv.ticket_min_eur != null && inv.ticket_max_eur != null) {
    if (need >= inv.ticket_min_eur * 0.5 && need <= inv.ticket_max_eur * 1.5) {
      ticket = need >= inv.ticket_min_eur && need <= inv.ticket_max_eur ? 1 : 0.6;
      reasons.push(`Ticket ${eur(inv.ticket_min_eur)}–${eur(inv.ticket_max_eur)} fits ~${eur(need)} raise`);
    } else {
      ticket = 0.15;
      blockers.push(`Ticket ${eur(inv.ticket_min_eur)}–${eur(inv.ticket_max_eur)} vs ~${eur(need)} need`);
    }
  }

  let impact = 0.8;
  if (inv.impact_required) {
    if (s.oirl >= 4) { impact = 1; reasons.push(`Impact investor — OIRL ${s.oirl} meets the bar`); }
    else if (s.oirl >= 2) { impact = 0.5; blockers.push(`Impact investor expects measurable impact (OIRL ${s.oirl})`); }
    else { impact = 0.1; blockers.push("Impact investor — no credible impact thesis yet"); }
  }

  const readiness = clamp((s.irl - 1) / 8);
  const components = { sector: sec.score, stage: stg.score, geo: geo.score, ticket, impact, readiness };
  const fit = 0.3 * sec.score + 0.2 * stg.score + 0.15 * geo.score + 0.15 * ticket + 0.1 * impact + 0.1 * readiness;
  const status = blockers.length === 0 ? "ready" : stg.distance === 1 ? "stretch" : "after_milestone";
  const feasibility = status === "ready" ? 1 : 0.7;
  const partnerBoost = inv.is_challenge_partner ? 1.05 : 1;
  if (inv.is_challenge_partner) reasons.push("Challenge partner — direct line");
  return {
    target_type: "investor", target_id: inv.id, name: inv.name, fit, priority: fit * feasibility * partnerBoost,
    status, reasons, blockers, components,
  };
}

// ---------- Funding (grants, loans, prizes, programmes) ----------
export function matchFunding(s: StartupSnapshot, f: Funding, now = new Date()): MatchResult | null {
  const reasons: string[] = [];
  const blockers: string[] = [];

  const geo = geoFit(s.country, f.geo_eligibility);
  if (geo.score === 0) return null;
  if (geo.label && f.geo_eligibility.length && !f.geo_eligibility.includes("global")) reasons.push(`Eligible: ${f.geo_eligibility.join(", ")}`);

  const sec = sectorFit(s.sectors, f.sectors);
  if (sec.score === 0) return null;
  if (sec.matched.length) reasons.push(`Topic: ${sec.matched.map(sectorLabel).join(", ")}`);
  else if (f.sectors.includes("*blue")) reasons.push("Blue economy focus");

  const companyApplicant = f.applicant.some((a) => ["startup", "sme", "company"].includes(a));
  const consortium = f.applicant.includes("consortium");
  if (!companyApplicant && !consortium) {
    if (f.applicant.includes("research_org") && s.stage === "research") reasons.push("Open to research teams");
    else return null;
  }
  if (consortium && !companyApplicant) blockers.push("Consortium application — needs partners");

  const stg = stageFit(s.stage, f.stages);
  if (stg.distance >= 2) return null;
  if (stg.distance === 1) blockers.push(`Targets ${f.stages.map((x) => STAGE_LABELS[x]).join("/")}`);

  let gate = 1;
  if (f.trl_min != null && s.trl < f.trl_min) {
    if (s.trl === f.trl_min - 1) { gate = 0.6; blockers.push(`Needs TRL ≥ ${f.trl_min} (now ${s.trl})`); }
    else return null;
  } else if (f.trl_max != null && s.trl > f.trl_max) {
    gate = s.trl > f.trl_max + 1 ? 0.3 : 0.5;
    blockers.push(`Designed for TRL ${f.trl_min ?? 1}–${f.trl_max} (you're TRL ${s.trl})`);
  } else if (f.trl_min != null) reasons.push(`TRL ${s.trl} within ${f.trl_min}–${f.trl_max ?? 9}`);

  if (f.requires) blockers.push(`Requires: ${f.requires}`);

  const urg = urgency(f.deadline_date, now);
  if (urg === 0) return null;
  if (urg > 1) reasons.push(`Deadline soon: ${f.deadline_date}`);
  else if (f.rolling) reasons.push("Rolling applications");

  const amount = f.amount_max_eur ?? f.equity_max_eur ?? null;
  const value = amount ? clamp(0.6 + Math.log10(amount / 25_000) / 6, 0.6, 1.2) : 0.8;
  if (amount) reasons.push(`Up to ${eur(amount)}${f.equity_max_eur ? ` + ${eur(f.equity_max_eur)} equity` : ""}`);

  const components = { geo: geo.score, sector: sec.score, stage: stg.score, gate, value };
  const fit = 0.25 * geo.score + 0.3 * sec.score + 0.2 * stg.score + 0.25 * gate;
  const tooMature = f.trl_max != null && s.trl > f.trl_max;
  const status = gate < 1 && !tooMature ? "after_milestone" : blockers.length ? "stretch" : "ready";
  const feasibility = status === "ready" ? 1 : status === "stretch" ? 0.75 : 0.6;
  const partnerBoost = f.is_challenge_partner ? 1.05 : 1;
  return {
    target_type: "funding", target_id: f.id, name: f.name, fit, priority: fit * feasibility * urg * value * partnerBoost,
    status, reasons, blockers, components, deadline_date: f.deadline_date, amount_eur: amount,
  };
}

// ---------- Partners & clients ----------
export function matchPartner(s: StartupSnapshot, p: Partner): MatchResult | null {
  const reasons: string[] = [];
  const blockers: string[] = [];

  const sec = sectorFit(s.sectors, p.sectors);
  if (sec.score === 0) return null;
  if (sec.matched.length) reasons.push(`Works in ${sec.matched.map(sectorLabel).join(", ")}`);

  const geo = geoFit(s.country, p.region.length ? p.region : p.hq ? [p.hq] : []);
  const near = s.country && (p.hq === s.country || p.region.includes(s.country)) ? 1 : geo.score || 0.4;
  if (near === 1 && s.country) reasons.push(`Local to ${s.country}`);

  // Which roles are useful depends on readiness.
  const roleValue: Record<string, number> = {
    pilot_partner: s.trl >= 4 && s.trl <= 7 ? 1 : 0.4,
    client: s.brl >= 5 ? 1 : s.brl >= 4 ? 0.6 : 0.3,
    research_partner: s.trl <= 5 || s.oirl <= 5 ? 1 : 0.5,
    certifier: s.trl >= 6 && s.trl <= 8 ? 1 : 0.2,
    channel: s.brl >= 5 ? 0.9 : 0.4,
    ecosystem: 0.6,
    data_provider: 0.6,
    investor: 0.5,
    acquirer: s.brl >= 7 ? 0.8 : 0.2,
    service_provider: 0.3,
    policy: 0.3,
  };
  const best = p.role.reduce((m, r) => Math.max(m, roleValue[r] ?? 0.3), 0);
  const bestRole = p.role.find((r) => (roleValue[r] ?? 0.3) === best) ?? p.role[0];
  const roleText: Record<string, string> = {
    pilot_partner: `Pilot site to move TRL ${s.trl} → ${Math.min(9, s.trl + 1)}`,
    client: "Potential paying customer",
    research_partner: "Research partner for validation & EU consortia",
    certifier: "Certification path to TRL 8",
    channel: "Channel into customers",
    acquirer: "Strategic acquirer",
    data_provider: "Data for impact validation",
  };
  if (roleText[bestRole]) reasons.push(roleText[bestRole]);
  if (best < 0.5) blockers.push("More valuable at a later stage");

  const components = { sector: sec.score, proximity: near, role: best };
  const fit = 0.45 * sec.score + 0.2 * near + 0.35 * best;
  const status = best >= 0.6 ? "ready" : "after_milestone";
  return {
    target_type: "partner", target_id: p.id, name: p.name, fit, priority: fit * (status === "ready" ? 1 : 0.7),
    status, reasons, blockers, components,
  };
}

export interface MatchSet {
  investors: MatchResult[];
  funding: MatchResult[];
  partners: MatchResult[];
}

export function matchAll(
  s: StartupSnapshot,
  data: { investors: Investor[]; funding: Funding[]; partners: Partner[] },
  now = new Date(),
): MatchSet {
  const rank = (xs: (MatchResult | null)[]) =>
    xs.filter((x): x is MatchResult => !!x).sort((a, b) => b.priority - a.priority);
  return {
    investors: rank(data.investors.map((i) => matchInvestor(s, i))),
    funding: rank(data.funding.map((f) => matchFunding(s, f, now))),
    partners: rank(data.partners.map((p) => matchPartner(s, p))),
  };
}
