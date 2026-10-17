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
