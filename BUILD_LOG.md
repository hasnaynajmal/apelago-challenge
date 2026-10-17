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
