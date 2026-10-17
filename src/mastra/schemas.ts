// Structured-output schemas for the agent team.
import { z } from "zod";

const sectorIds = [
  "aquaculture_fisheries", "blue_biotech", "blue_energy", "ocean_observation", "shipping_ports", "water_management",
  "pollution_cleanup", "restoration_blue_carbon", "coastal_tourism", "circular_materials", "seafood_alt_protein", "climate_software",
] as const;

export const evidenceSchema = z.object({
  claim: z.string().describe("Short factual claim"),
  quote: z.string().optional().describe("Verbatim snippet supporting the claim, if available"),
  source: z.string().describe("URL, 'pitch deck', or 'seed data'"),
});

export const profileSchema = z.object({
  summary: z.string().describe("2-3 sentence neutral description"),
  website: z.string().nullable(),
  country: z.string().nullable().describe("ISO 3166 alpha-2 code"),
  city: z.string().nullable(),
  founded: z.number().int().nullable(),
  sectors: z.array(z.enum(sectorIds)).min(1).describe("Most relevant first"),
  stage: z.enum(["research", "pre_seed", "seed", "series_a", "series_b_plus", "growth"]).nullable(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  technology: z.string().optional(),
  business_model: z.string().optional(),
  customers: z.array(z.string()).describe("Named customers, pilots or LOIs"),
  traction: z.array(z.string()).describe("Concrete traction facts with dates"),
  team: z.array(z.object({ name: z.string(), role: z.string(), background: z.string().optional() })),
  funding_history: z.array(z.object({
    round: z.string(), amount_eur: z.number().nullable(), date: z.string().nullable(), investors: z.array(z.string()),
  })),
  raising: z.object({ round: z.string().nullable(), amount_eur: z.number().nullable() }).nullable(),
  impact_claims: z.array(z.string()),
  evidence: z.array(evidenceSchema).describe("8-15 key facts with sources"),
  sources: z.array(z.string()),
});
export type ProfileOutput = z.infer<typeof profileSchema>;

const assessmentBase = {
  level: z.number().int().min(1).max(9),
  confidence: z.number().min(0).max(1).describe("How well the evidence supports this level"),
  rationale: z.string().describe("Max 2 short sentences (under 45 words): why this level and not the next one. Plain words, no level definitions."),
  evidence: z.array(evidenceSchema).describe("Facts that determined the level"),
  gaps: z.array(z.string()).describe("Up to 3 short items (under 12 words each): missing information that would change the assessment"),
  next_requirements: z.array(z.string()).describe("Up to 3 short items (under 15 words each): concrete things needed to reach the next level"),
};

export const levelAssessmentSchema = z.object(assessmentBase);
export type LevelAssessment = z.infer<typeof levelAssessmentSchema>;

export const impactAssessmentSchema = z.object({
  ...assessmentBase,
  impact_areas: z.array(z.enum(["A", "B", "C", "D", "E", "F"])).describe("Ocean Impact Navigator areas touched"),
  kpis: z.array(z.object({ code: z.string().describe("e.g. B3"), name: z.string(), estimate: z.string().nullable() })),
  coupling: z.number().min(0).max(1).describe("How strongly impact scales with revenue (1 = every sale creates impact)"),
  intensity: z.enum(["low", "medium", "high"]),
  red_flags: z.array(z.string()).describe("Impact-washing risks, rebound effects, unaccounted emissions"),
});
export type ImpactAssessment = z.infer<typeof impactAssessmentSchema>;

const dim = z.object({ score: z.number().int().min(1).max(5).nullable().describe("null if no evidence"), note: z.string() });
export const investmentAssessmentSchema = z.object({
  dimensions: z.object({
    market: dim, product: dim, team: dim, business_model: dim, competition: dim,
    go_to_market: dim, financials: dim, tech: dim, deal_dynamics: dim, impact: dim,
  }),
  strengths: z.array(z.string()).describe("Up to 4"),
  risks: z.array(z.string()).describe("Up to 4"),
  deal_notes: z.string().describe("What an investor should check first"),
  headline: z.string().describe("One sentence, under 25 words: the investment thesis for this startup"),
});
export type InvestmentAssessment = z.infer<typeof investmentAssessmentSchema>;

export const rationaleSchema = z.object({
  items: z.array(z.object({ key: z.string().describe("the given match key"), rationale: z.string().describe("1-2 sentences, specific") })),
});

export const actionsSchema = z.object({
  actions: z.array(z.object({
    horizon: z.enum(["now", "30d", "90d"]),
    title: z.string().describe("Imperative, max 10 words"),
    detail: z.string().describe("One sentence: concrete how-to naming the investor/programme/partner"),
    owner: z.enum(["startup", "operator"]),
    unlocks: z.array(z.string()).describe("Opportunities this unlocks"),
    deadline_date: z.string().nullable().describe("YYYY-MM-DD if tied to a deadline"),
  })).describe("6-10 actions, most important first"),
});
export type ActionsOutput = z.infer<typeof actionsSchema>;
