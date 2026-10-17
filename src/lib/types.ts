// Row types for the Supabase tables (see supabase/migrations/0001_init.sql).
import type { Framework, Sector, Stage } from "./taxonomy";

export interface ThesisConfig {
  sectors: Sector[];
  adjacent_sectors: Sector[];
  stages: Stage[];
  geographies: string[];
  ticket_eur: [number, number] | null;
  impact_required: boolean;
  tech_required: boolean;
  weights: Record<string, number>;
  promise_weights: { irl: number; thesis_fit: number; impact: number; momentum: number; team: number };
  programmes?: Record<string, { name: string; fit: string }>;
}

export interface Thesis {
  id: string;
  name: string;
  kind: "vc" | "accelerator" | "custom";
  description: string | null;
  config: ThesisConfig;
}

export interface Evidence {
  claim: string;
  quote?: string;
  source: string; // url or "pitch deck p.4" or "seed data"
}

export interface StartupProfile {
  summary: string;
  problem?: string;
  solution?: string;
  business_model?: string;
  customers?: string[];
  traction?: string[];
  team?: { name: string; role: string; background?: string }[];
  funding_history?: { round: string; amount_eur?: number; date?: string; investors?: string[] }[];
  raising?: { round?: string; amount_eur?: number };
  technology?: string;
  impact_claims?: string[];
  evidence: Evidence[];
  sources: string[];
}

export interface Startup {
  id: string;
  name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  founded: number | null;
  one_liner: string | null;
  sectors: Sector[];
  stage: Stage | null;
  known_funding_eur: number | null;
  source: string | null;
  apelago_alumnus: boolean;
  demo_priority: string | null;
  logo_url: string | null;
  profile: StartupProfile | null;
}

export interface Investor {
  id: string;
  name: string;
  type: "vc" | "cvc" | "pe" | "public_investor" | "angel_network";
  hq: string | null;
  region_focus: string[];
  stages: Stage[];
  ticket_min_eur: number | null;
  ticket_max_eur: number | null;
  fund_size_eur_m: number | null;
  sectors: Sector[];
  thesis: string | null;
  impact_required: boolean;
  portfolio: string[];
  website: string | null;
  confidence: string | null;
  is_challenge_partner: boolean;
}

export interface Funding {
  id: string;
  name: string;
  provider: string | null;
  kind: string;
  geo_eligibility: string[];
  applicant: string[];
  stages: Stage[];
  amount_min_eur: number | null;
  amount_max_eur: number | null;
  equity_min_eur: number | null;
  equity_max_eur: number | null;
  cofunding_pct: number | null;
  trl_min: number | null;
  trl_max: number | null;
  sectors: string[]; // may contain "*" or "*blue"
  deadline_text: string | null;
  deadline_date: string | null;
  rolling: boolean;
  description: string | null;
  url: string | null;
  requires: string | null;
  confidence: string | null;
  is_challenge_partner: boolean;
}

export interface Partner {
  id: string;
  name: string;
  kind: "corporate" | "research" | "ecosystem" | "public";
  role: string[];
  hq: string | null;
  region: string[];
  sectors: string[];
  needs: string | null;
  why_partner: string | null;
  confidence: string | null;
}

export interface Relationship {
  from_type: EntityType;
  from_id: string;
  to_type: EntityType;
  to_id: string;
  rel: string;
  note: string | null;
}

export type EntityType = "startup" | "investor" | "funding" | "partner";

export interface Assessment {
  startup_id: string;
  framework: Framework;
  level: number;
  confidence: number | null;
  distribution: Record<string, number> | null;
  calibrator: "jev" | "claude" | null;
  rationale: string | null;
  evidence: Evidence[];
  gaps: string[];
  next_requirements: string[];
  details: Record<string, unknown> | null;
  needs_review: boolean;
  model: string | null;
}

export type MatchTarget = "investor" | "funding" | "partner";

export interface Match {
  startup_id: string;
  thesis_id: string;
  target_type: MatchTarget;
  target_id: string;
  fit: number;
  priority: number;
  rank: number | null;
  status: "ready" | "stretch" | "after_milestone";
  reasons: string[];
  blockers: string[];
  rationale: string | null;
  calibrated_fit: number | null;
}
