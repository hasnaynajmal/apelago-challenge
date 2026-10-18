# A'Pelago Atlas

**Venture intelligence for the blue economy.** Atlas turns scattered startup and ecosystem data into a ranked,
explained view of which ocean startups to back or accelerate, and what each one should do next.

Built at **JunctionX Turku 2026** for the challenge by **A'Pelago** (Baltic blue-economy accelerator) and
**Redstone Blue** (blue-economy VC).

- **Live app:** https://apelago-atlas.vercel.app
- **Plain-language guide (start here):** https://apelago-atlas.vercel.app/dashboard/guide

---

## What it answers

The challenge asked for a prototype that answers five questions. Each one has a home in the app:

| Question | Where Atlas answers it |
|---|---|
| Which startups are most promising? | Overview → Top picks; a 0–100 score on every venture |
| Why, and how do they fit an investment or accelerator thesis? | Venture page → score breakdown, thesis fit and verdict |
| How ready are they? (Ocean Impact, Business, Technology, Investment) | Venture page → four readiness levels (1–9) with reasoning and missing evidence |
| Which investors, funding, partners and clients are relevant next, in priority order? | Venture page → Opportunities (ranked, with reasons and blockers) and Connections |
| What should they do next? | Venture page → Action plan; Overview → This week's moves |

## Highlights

- **Deep Panel:** a team of AI agents researches any startup on the web and assesses it live in about 45 seconds.
  A live feed shows every step, and the venture page opens by itself when it finishes.
- **Four readiness levels:** TRL (EU scale), BRL (KTH Innovation Readiness Level), Ocean Impact Readiness (based on
  the Ocean Impact Navigator: 6 impact areas, 30 KPIs) and Investment Readiness (a weighted 10-dimension rubric).
- **Second Opinion:** an independent calibrated model scores every level again. When it clearly disagrees, the level
  is flagged for human review instead of being trusted blindly.
- **Thesis switch ("Evaluate for"):** the same portfolio scored for Redstone Blue's fund thesis, A'Pelago's
  accelerator criteria or a custom thesis. Scores, groups, rankings and investor framing all change. Redstone never
  matches itself; other funds become co-investors or follow-on investors.
- **Hidden connections:** warm intro paths through real relationships (partners, programmes, LPs), ready-made grant
  consortia, synergies between portfolio ventures, and milestones that unlock new investors or grants.
- **Ask Atlas:** a chat copilot (CopilotKit) that knows which page you are on, answers from the data with clickable
  cards (venture lists, comparisons, deadlines, warm paths) and can open pages or switch the thesis for you.
- **Portfolio view:** four groups (Investment-ready, Accelerate, Refer onwards, Monitor), a weekly to-do list across
  the portfolio, upcoming funding deadlines with eligible ventures, and the investors worth activating first.
- Works on desktop and phone.

## Architecture

![A'Pelago Atlas architecture: users reach one Next.js app on Vercel (dashboard, Ask Atlas, two API routes); the Deep Panel agent team (Mastra, Claude Haiku) runs Scout, readiness review, Matchmaker, Connector, Narrator and Strategist; Anthropic Claude and a Second Opinion model are external AI services; Supabase Postgres stores everything and streams the live run feed](docs/architecture.png)

## How an assessment works

```
Startup name / website
        │
        ▼
  1. Scout ───────────── web research (3 searches) → evidence-backed profile with sources
        │
        ▼
  2. Readiness review ── TRL · BRL · Ocean Impact · Investment assessors, in parallel
     + Second Opinion ── independent calibrated levels → "Review" flag on strong disagreement
        │
        ▼
  3. Matchmaker ──────── ranks 40+ investors, 30+ funding programmes, 40+ partners
                         (sector, stage, geography, ticket, readiness gates)
        │
        ▼
  4. Connector ───────── warm paths, consortia, synergies, unlocks (relationship graph)
        │
        ▼
  5. Narrator ∥ 6. Strategist ── match explanations and a prioritised action plan, in parallel
        │
        ▼
  Scores for every thesis → Supabase → live UI (Realtime)
```

The LLM agents do research and judgement. Matching, graph search and scoring are plain, deterministic TypeScript
(`src/lib/engine`), so rankings are explainable and fast.

**Score (0–100)** blends five parts with thesis-specific weights:

| Thesis | Investment readiness | Thesis fit | Ocean impact | Momentum | Team |
|---|---|---|---|---|---|
| Redstone Blue VC | 35% | 25% | 20% | 10% | 10% |
| A'Pelago Accelerator | 20% | 25% | 30% | 10% | 15% |
| Custom (Nordic climate) | 45% | 30% | 5% | 10% | 10% |

**Groups:** thesis fit ≥ 75% and mean of TRL/BRL/IRL ≥ 4.5 → Investment-ready; fit only → Accelerate;
maturity only → Refer onwards; neither → Monitor.

## Tech stack

One Next.js app. There is no separate backend: API routes and server components do the server work.

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router, Turbopack, Cache Components), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, React Bits (vendored), Motion, Recharts, React Flow, Geist |
| Agents | Mastra (agents with structured output), Vercel AI SDK, Anthropic Claude (Haiku 5.5 by default) |
| Research | Anthropic server-side web search |
| Second Opinion | Calibrated scoring model via Vercel AI Gateway |
| Copilot | CopilotKit v2 + AG-UI (`@ag-ui/mastra`): page context, tool-call cards, frontend tools |
| Data | Supabase Postgres with Realtime (live run feed); row-level security, writes only server-side |
| Hosting | Vercel (assessments run in the background with `after()`) |

## Project structure

```
src/
  app/
    (site)/                 landing page
    dashboard/              overview, ventures, startups/[id], deadlines, investors, assess, runs/[runId], guide
    api/assess/             start an assessment (runs in the background)
    api/copilotkit/         CopilotKit runtime for Ask Atlas
  mastra/
    agents.ts               the Deep Panel agents and their prompts
    schemas.ts              structured outputs (Zod)
    copilot.ts              Ask Atlas agent + read-only data tools
  lib/
    pipeline/run.ts         the assessment pipeline
    engine/                 matching, scoring, connections (deterministic)
    calibrator/             Second Opinion client
    queries.ts              read models for the UI
    frameworks.ts           TRL / BRL / OIRL / IRL rubrics
    lens.ts                 theses and investor framing
  components/               UI (overview, dossier, copilot, guide, …)
supabase/
  migrations/0001_init.sql  schema, RLS, Realtime
  seed/*.json               theses, startups, investors, funding, partners, relationships
scripts/                    migrate, seed, batch assess, inspection helpers
```

## Run it locally

Requirements: Node 20+, a Supabase project and an Anthropic API key. A Vercel AI Gateway key is optional;
without it the Second Opinion is skipped and the assessors' own confidence is used.

```bash
npm install
cp .env.example .env.local     # fill in the values (see below)
npm run db:migrate             # create tables, RLS and Realtime
npm run db:seed                # load theses, startups, investors, funding, partners, relationships
npm run assess -- --all        # optional: assess every seeded startup (uses the API, costs money)
npm run dev                    # http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser client (read-only via RLS, Realtime) |
| `SUPABASE_SECRET_KEY` | Server-side writes (never exposed to the browser) |
| `SUPABASE_DB_URL` | Session-pooler connection string, used only by the migration and seed scripts |
| `ANTHROPIC_API_KEY` | Claude for the Deep Panel and Ask Atlas |
| `RADAR_MODEL`, `RADAR_FAST_MODEL`, `RADAR_EFFORT` | Model and thinking effort (defaults: Haiku 5.5, `low`) |
| `AI_GATEWAY_API_KEY` | Second Opinion model via Vercel AI Gateway (optional) |

Useful commands:

```bash
npm run assess -- npharvest               # re-assess one startup (reuses its stored research)
npm run assess -- npharvest --research    # force fresh web research
npm run build                             # production build
```

**Cost:** on Haiku 5.5 a full assessment with web research costs roughly $0.05–0.10, and an Ask Atlas message
about $0.01. Set a spend limit in the Anthropic Console before sharing a public deployment.

## Data

- **Startups:** A'Pelago accelerator alumni and ventures from the EU Blue Economy Observatory (seed data), plus any
  startup added through the Assess page.
- **Ecosystem:** curated lists of ocean and climate investors, EU and Nordic funding programmes, and corporate,
  research and public partners, with the known relationships between them (used for warm paths and consortia).
- **Research:** public web sources found by the Scout, stored with every profile and shown on the venture page.

## Limits

Assessments are only as good as the public evidence. Low confidence or a Review flag means a person should check
before acting. Atlas supports decisions; it does not make them. Seed lists of investors, programmes and
relationships are curated for the prototype and would be connected to live sources in production.

## Team

**Team Outliers** — Hasnain, Behroz, Abubakar and Rehan — at JunctionX Turku 2026.
