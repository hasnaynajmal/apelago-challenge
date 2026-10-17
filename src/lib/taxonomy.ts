// Shared taxonomy used by startups, investors, funding and partners (mirrors supabase/seed data).

export const SECTORS = {
  aquaculture_fisheries: "Aquaculture & fisheries",
  blue_biotech: "Blue biotech",
  blue_energy: "Blue energy",
  ocean_observation: "Ocean observation & data",
  shipping_ports: "Shipping & ports",
  water_management: "Water management",
  pollution_cleanup: "Pollution cleanup",
  restoration_blue_carbon: "Restoration & blue carbon",
  coastal_tourism: "Coastal tourism",
  circular_materials: "Circular materials",
  seafood_alt_protein: "Seafood & alt protein",
  climate_software: "Climate software",
} as const;
export type Sector = keyof typeof SECTORS;

export const STAGES = ["research", "pre_seed", "seed", "series_a", "series_b_plus", "growth"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABELS: Record<Stage, string> = {
  research: "Research",
  pre_seed: "Pre-seed",
  seed: "Seed",
  series_a: "Series A",
  series_b_plus: "Series B+",
  growth: "Growth",
};

export const FRAMEWORKS = {
  trl: { label: "Technology Readiness", short: "TRL", max: 9 },
  brl: { label: "Business Readiness", short: "BRL", max: 9 },
  oirl: { label: "Ocean Impact Readiness", short: "OIRL", max: 9 },
  irl: { label: "Investment Readiness", short: "IRL", max: 9 },
} as const;
export type Framework = keyof typeof FRAMEWORKS;

export const IRL_DIMENSIONS = {
  market: "Market",
  product: "Product",
  team: "Team",
  business_model: "Business model",
  competition: "Competition",
  go_to_market: "Marketing & distribution",
  financials: "Financials",
  tech: "Tech",
  deal_dynamics: "Deal dynamics",
  impact: "Impact",
} as const;
export type IrlDimension = keyof typeof IRL_DIMENSIONS;

export const IMPACT_AREAS = {
  A: "Sustainably managed ocean resources",
  B: "A clean ocean",
  C: "Thriving & restored marine habitats",
  D: "Towards a 1.5°C world",
  E: "Resilient coastal communities",
  F: "Positive socio-economic outcomes",
} as const;
export type ImpactArea = keyof typeof IMPACT_AREAS;

/** Expand region tokens (nordics, baltics, …) to country codes for geo matching. */
export const REGION_GROUPS: Record<string, string[]> = {
  nordics: ["FI", "SE", "NO", "DK", "IS"],
  baltics: ["EE", "LV", "LT"],
  baltic_sea: ["FI", "SE", "DK", "DE", "PL", "EE", "LV", "LT"],
  EU: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"],
  horizon_associated: ["NO", "IS", "GB", "CH", "IL", "TR", "UA"],
  EEA: ["NO", "IS", "LI"],
};
