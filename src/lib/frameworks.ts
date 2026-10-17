// Assessment rubrics used in agent prompts and as Jev score criteria.
// Sources: Aalto/EU TRL, KTH Business Readiness Level, Ocean Impact Navigator (1000 Ocean Startups / WEF).

export const TRL_LEVELS = [
  "TRL 1 – Basic principles observed: scientific research only, properties reported.",
  "TRL 2 – Technology concept formulated: practical application speculated, no experimental proof.",
  "TRL 3 – Experimental proof of concept: components validated separately in lab.",
  "TRL 4 – Technology validated in lab: integrated lab prototype.",
  "TRL 5 – Validated in relevant environment: tested in simulated/realistic controlled conditions (e.g. tank, harbour basin).",
  "TRL 6 – Demonstrated in relevant environment: pilot-scale prototype in a real but not fully operational setting.",
  "TRL 7 – System prototype in operational environment: field trial under real operating conditions.",
  "TRL 8 – System complete and qualified: final product proven, certified/class-approved, sold.",
  "TRL 9 – Proven in operational environment: multiple commercial deployments running at scale.",
];

export const BRL_LEVELS = [
  "BRL 1 – Hypothesizing on a business concept; little insight into market and competition.",
  "BRL 2 – Business concept described (e.g. NABC); overall market (TAM) and some competitors identified.",
  "BRL 3 – Draft business model canvas without revenues/costs; TAM/SAM quantified; complete competitor overview.",
  "BRL 4 – Full business model incl. revenues/costs; first bottom-up economic projections; competitive positioning.",
  "BRL 5 – Parts of business model tested with customers; revenue model with pricing hypotheses; differentiation verified by market feedback.",
  "BRL 6 – Full business model incl. pricing verified via test sales / paid pilots; 1–3 year P&L projections.",
  "BRL 7 – Product/market fit: significant customer use and payment willingness; projections validated by sales; scaling preparations.",
  "BRL 8 – Sales and metrics show the model holds and scales; channels and supply chain in place.",
  "BRL 9 – Scaling with growing recurring revenues; profitable and sustainable business.",
];

export const OIRL_LEVELS = [
  "OIRL 1 – Ocean relevance hypothesised: vague sustainability claim, no mechanism.",
  "OIRL 2 – Impact thesis articulated: clear theory of change to ≥1 Ocean Impact Navigator area.",
  "OIRL 3 – KPIs mapped: outcome/impact-level Navigator KPIs identified (not just operational).",
  "OIRL 4 – Baseline & estimation method: baseline defined, ex-ante impact estimated with assumptions.",
  "OIRL 5 – Estimated impact from pilot data per unit deployed.",
  "OIRL 6 – Measured impact in a real deployment (quantitative KPI with data).",
  "OIRL 7 – Reported & tracked: regular impact reporting, negative impacts disclosed.",
  "OIRL 8 – Third-party verified (LCA review, registry, certification, academic validation).",
  "OIRL 9 – Verified impact at scale, intrinsically linked to revenue.",
];

export const IRL_DIMENSION_RUBRIC: Record<string, string> = {
  market: "1 no sizing/unclear customer · 3 TAM/SAM quantified, segment chosen · 5 large growing market with regulatory tailwind and urgent pain",
  product: "1 concept only · 3 working prototype/pilot, clear value prop · 5 product in use with proven ROI",
  team: "1 solo/no domain fit · 3 complementary founders, some domain experience · 5 complete experienced team, prior exits, strong advisors",
  business_model: "1 unclear who pays · 3 revenue model + pricing hypotheses · 5 proven recurring revenue, healthy unit economics",
  competition: "1 unaware of competitors · 3 competitor map, some differentiation · 5 defensible moat (IP, data, network, approvals)",
  go_to_market: "1 no go-to-market · 3 GTM defined, first channels/partners · 5 proven repeatable channel, distribution partners",
  financials: "1 no financial info · 3 projections, some revenue or grants · 5 revenue traction, clear use of funds, runway",
  tech: "1 unproven science · 3 validated in relevant environment (TRL 5–6) · 5 proven in operation, IP-protected (TRL 8–9)",
  deal_dynamics: "1 no round/unclear ask · 3 raising with defined ask · 5 strong lead/syndicate, clean cap table, good timing",
  impact: "1 no credible impact · 3 impact thesis + mapped KPIs · 5 measured/verified impact linked to revenue",
};

export const OCEAN_KPIS = `A Sustainably managed ocean resources: A1 biomass preserved/restored · A2 seafood waste reduced · A3 welfare of marine life · A4 tonnes seaweed & bivalves produced
B A clean ocean: B1 micro-plastics diverted · B2 macro-plastic diverted · B3 N/P pollution mitigated · B4 contaminated wastewater diverted · B5 invasive species reduced · B6 other pollution reduced (chemicals, metals, noise)
C Thriving & restored habitats: C1 coral · C2 mangroves · C3 seagrass · C4 salt marsh · C5 kelp · C6 other habitat area protected/restored
D Towards 1.5°C: D1 GHG reduced/avoided · D2 GHG generated · D3 carbon sequestered · D4 NOx mitigated · D5 SOx mitigated
E Resilient coastal communities: E1 coastline protected · E2 ocean info used for adaptation decisions · E3 people supported to adapt · E4 food security
F Socio-economic: F1 jobs created · F2 people trained · F3 share of women employees · F4 entry wage vs minimum wage · F5 particulate emissions mitigated`;
