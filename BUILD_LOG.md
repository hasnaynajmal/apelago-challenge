# Build Log — Ocean Opportunity Radar

Handoff log: one entry appended per major phase, so any developer or AI coding tool can pick up where the last one stopped.
Each entry: what was done, key files, decisions, how to run/verify, open issues, next step.

**Project:** A'Pelago × Redstone Blue challenge, JunctionX Turku (Oct 2026). Tool that assesses ocean startups (TRL, BRL,
Ocean Impact RL, Investment RL) and ranks their next investors, grants, partners and actions.
**Reference material (local only, gitignored):** `knowledge-base/`. Start with `knowledge-base/README.md` and `knowledge-base/architecture.md`.
**Stack:** Next.js 16 (single app) · Tailwind v4 + shadcn + Aceternity + React Bits · Mastra agents · CopilotKit v2 (AG-UI) ·
Claude Sonnet 5.5 (`RADAR_MODEL`) · Jev via Vercel AI Gateway (optional, Claude fallback) · Supabase (Postgres + Realtime).
**Env:** copy `.env.example` → `.env.local`.

---

## Phase 0 — Research & knowledge base (2026-10-17) ✅
- Built `knowledge-base/`: frameworks (TRL, BRL, Ocean Impact Navigator → derived OIRL, 10-dim investment readiness),
  datasets (42 investors, 32 funding programmes, 42 partners, 22 seed startups, shared sector taxonomy), A'Pelago brand
  tokens + logos, verified tech notes (Mastra 1.78, CopilotKit 1.79 v2 API, @ag-ui/mastra 2.0.1, Jev API, Supabase plan).
- Decisions: no separate backend; Mastra + CopilotKit core; Sonnet 5.5 default model; Supabase as DB; knowledge base never committed.
- Added `.env.example`, `knowledge-base/` to `.gitignore`.
- **Next:** Phase 1 — scaffold Next.js app in repo root, smoke tests (Claude structured output on Sonnet 5.5, Jev via gateway,
  Supabase connection), Supabase schema + seed.

## Phase 1 — Scaffold, smoke tests, database (2026-10-17) ✅
Branch: `dev` (commits e5332f7 → 93b3626).
- **App scaffold:** Next.js 16.4.2 (App Router, TS, Tailwind v4, `src/`), `cacheComponents` + `partialPrefetching` ON
  (template default → uncached data in server components must sit inside `<Suspense>` or use `"use cache"`; no `runtime` exports).
  Next ships its own docs in `node_modules/next/dist/docs/` — read them before using Next APIs (see AGENTS.md).
- **Brand assets:** `public/brand/` (A'Pelago logos, wave SVGs), `src/app/fonts/Urbanist-VariableFont.woff2`.
- **Deps:** @mastra/core 1.78, @mastra/pg, @ag-ui/mastra 2.0.1, @copilotkit/* 1.79.1 (use `/v2` entry points), @ai-sdk/anthropic,
  @supabase/supabase-js + ssr, @xyflow/react, recharts, motion. Zod resolved to 3.25 (peer deps).
- **Smoke tests (all pass):** Supabase keys + Postgres 17 (session pooler URL), Claude Sonnet 5.5 + Haiku 5.5, Jev via Vercel AI
  Gateway (`model: "jev"`, needs card on Vercel team), Mastra native structured output on Sonnet 5.5 (`npm run smoke`, ~4 s).
- **Database:** `supabase/migrations/0001_init.sql` — reference tables (theses, startups, investors, funding, partners,
  relationships) · agent outputs (assessments, matches, scores, actions, connections) · live pipeline (pipeline_runs,
  pipeline_events, Realtime enabled). RLS: public read; writes only with the secret key (server).
- **Seed:** `supabase/seed/*.json` (copied from knowledge base so the repo is self-contained) → 3 theses (redstone-blue,
  apelago-accelerator, nordic-climate-generalist), 42 investors, 32 funding, 42 partners, 22 startups, 35 relationship edges.
- **Code:** `src/lib/supabase/admin.ts` (server-only), `src/lib/supabase/browser.ts`, `src/lib/types.ts`, `src/lib/taxonomy.ts`.
- **Run:** `npm install` → `npm run db:migrate` → `npm run db:seed` → `npm run dev`. Typecheck: `npx next typegen && npx tsc --noEmit`.
- **Notes:** In Jev responses, score keys are 0-indexed (key 0 = level 1). Claude rated the smoke-test evidence TRL 8 where Jev
  said TRL 7 (55%), so the planned "needs review" flag for disagreements will trigger in practice.
- **Next:** Phase 2 — core engine: deterministic matching/scoring (`src/lib/engine/`), Jev calibrator with Claude fallback,
  Mastra agents (Scout, 4 assessors, Matchmaker narrative, Connector, Strategist) + workflow writing to Supabase + pipeline_events.

## Phase 2 — Engine, agents, pipeline (2026-10-17) ✅
Commits 4882a39 → 8969cc4 (no Claude co-author trailers from here on, per user).
- **Deterministic engine** (`src/lib/engine/`, pure TS, no LLM):
  - `matching.ts` — investors/funding/partners: hard filters (geo, sector, stage ±1, applicant type, TRL gates, past deadlines) →
    fit = weighted components → priority = fit × feasibility × urgency × value. Every match has `reasons[]`, `blockers[]`,
    `status` (ready / stretch / after_milestone). Challenge partners (Redstone, A'Pelago) get a small boost.
  - `scoring.ts` — IRL from 10 weighted dimensions with gates; thesis fit; promise score 0–100 with breakdown; A'Pelago programme fit.
  - `connections.ts` — warm-intro paths (BFS over `relationships` + virtual edges to top partner matches), unlock analysis
    (re-runs matching at TRL+1 / BRL+1 / OIRL+1 and counts newly ready opportunities), consortium builder, value-chain synergies, deadlines.
- **Calibrator** `src/lib/calibrator/jev.ts` — one Jev request scores TRL/BRL/OIRL (9 levels) + 10 IRL dims (5 levels);
  `calibrateFits` gives yes-probabilities for top-10 investors (adjusts priority ×0.75–1.25). Returns null on failure → Claude only.
- **Agents** `src/mastra/agents.ts` + schemas `src/mastra/schemas.ts` — Scout researcher (Claude server-side web search,
  `anthropic.tools.webSearch_20260209`, max 5 searches) + structurer, TRL/BRL/Ocean Impact assessors, Investment Analyst,
  Match Narrator (Haiku 5.5), Strategist. Models from env (`RADAR_MODEL`, `RADAR_FAST_MODEL`) via `@ai-sdk/anthropic`.
- **Pipeline** `src/lib/pipeline/run.ts` — scout → 4 assessors ∥ Jev → matching (+ existing-investor/grant detection from
  funding history, + Jev fit calibration) → connections → narratives → strategist actions → per-thesis scores. Writes
  assessments/matches (top 15 per type per thesis)/connections/actions/scores; emits `pipeline_events` (Realtime). ~50 s per
  startup with stored profile, ~70–90 s with web research.
  Review flag: Jev confidence ≥ 0.5 AND (argmax differs ≥ 2 or expected differs ≥ 1.5) → `needs_review`.
- **API** `POST /api/assess` `{ startupId }` or `{ name, website?, oneLiner?, country? }` → `{ runId, startupId }`, runs in `after()`.
- **Scripts:** `npm run assess -- <id> [--research]`, `npm run assess -- --all`, `npx tsx scripts/inspect.ts <id>`,
  `scripts/engine-check.ts` (engine only), `scripts/smoke-websearch.ts`.
- **Gotchas:** Structured-output arrays: avoid `.max()` in Zod (Claude may return more → validation error); trim in code.
  Mastra `res.sources` items are chunks: URL at `x.payload.url`.
- **Next:** Phase 3 — UI: theme (A'Pelago tokens, Urbanist), shadcn + Aceternity/React Bits, Radar home, startup dossier,
  opportunity constellation (React Flow), action plan, live intake with Realtime feed.
