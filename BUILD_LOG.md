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

## Phase 2b — Cost controls (2026-10-17) ✅
- All 22 seed startups are assessed and stored (batch hit a network outage; retry loop added to `scripts/assess.ts`).
- `RADAR_EFFORT` (default `low`) → every agent via `defaultOptions.providerOptions.anthropic.effort`. Verified on the wire
  with `scripts/smoke-effort.ts`. Dev model now Haiku 5.5 (`RADAR_MODEL=anthropic/claude-haiku-5-5`); switch to
  `anthropic/claude-sonnet-5-5` + `RADAR_EFFORT=medium` for the demo. Scout capped at 3 web searches.
- Rule: no paid batch/test runs without the user's OK. Sonnet 5.5 at default (high) effort ≈ $0.25–0.40 per startup with research.
- `npx tsx scripts/status.ts` shows assessment coverage per startup.

## Phase 3 — UI (2026-10-17) ✅
Commits ae849ea → b1e34f1.
- **Theme** `src/app/globals.css`: single dark "deep ocean" theme from A'Pelago tokens (navy #001835/#002444, gold #DFAE32
  as the only accent, ice #CFDEE8 text), data colours TRL cyan / BRL teal / OIRL green / IRL gold, `.glass`, `.tabular`,
  `.text-gradient-gold`, radar sweep + blip pulse keyframes. Urbanist via `next/font/local`. shadcn style `radix-nova`;
  `components.json` registries `@aceternity`, `@react-bits` (none installed yet). Sonner forced to dark (no next-themes).
- **Shell**: `site-header.tsx` (logo, nav, `lens-switcher.tsx` with motion pill; lens lives in `?lens=` — ids in `src/lib/lens.ts`).
- **/** Radar home (`components/radar/radar-board.tsx`): polar SVG — angle = primary sector, radius = promise (closer = hotter),
  size = OIRL, gold pulsing top 3, dashed = not assessed, amber ring = needs review; hover card; linked ranked list; hero stats.
- **/startups/[id]** dossier: promise + breakdown + programme, 4 readiness cards with Jev probability bars, IRL radar (Recharts),
  Ocean Impact Navigator panel, React Flow constellation (`dossier/constellation.tsx`), hidden connections, opportunities tabs
  with reasons/blockers/Jev fit, 3-horizon action plan, evidence & sources, run/re-run button.
- **/runs/[runId]** live run: Supabase Realtime on `pipeline_events` + `pipeline_runs` with 4 s polling backfill.
- **/intake**: new venture form → `POST /api/assess` → live run page.
- **Data access**: `src/lib/queries.ts` (getRadar, getDossier). Pages read `searchParams`/`params` inside `<Suspense>` (Cache
  Components); call `await connection()` before `Date.now()` in server code.
- **Not yet verified**: Realtime streaming end-to-end (needs one live paid run), visual QA in a browser.
- **Next:** Phase 4 — CopilotKit copilot (Mastra radar agent with tools over the data; generative UI cards), polish
  (Aceternity/React Bits accents, loading states), production build check, demo script.

## Phase 3b — UI redesign: light & minimal (2026-10-17) ✅
User feedback: the dark "glassy" UI was rejected (too stylised, fonts too small). Commit c5c974e.
- **Design rules now:** white background, Geist Sans (next/font/google), 15px base (`html { font-size: 15px }`), headings
  semibold with tight tracking (48–64px h1, 30px section h2), body text ≥ 14px (never 9–11px), neutral zinc greys,
  A'Pelago navy `#002444` = primary, gold only for highlights (`gold-ink #a87c12` for text on white, `gold-soft` backgrounds).
  Cards: `.card-surface` (white, 1px border, rounded-2xl, faint shadow) + `.card-hover`. Reference sites: Ramp, Mercury, Attio, Cal.com, Resend.
- **React Bits** (vendored source in `src/components/reactbits/`, not via CLI because the registry pins motion@12):
  BlurText (patched to render a `span`), RotatingText, CountUp, DotGrid, ShinyText, SpotlightCard (unused yet).
- **Logo:** `public/brand/apelago-logo-navy.svg` (white fills → navy) for light backgrounds.
- **Hydration rule:** round every computed SVG / React Flow coordinate (float differences between server and client caused
  mismatches). Radar uses `q()`; constellation uses `Math.round`.
- **Visual QA loop:** headless Chrome screenshots →
  `chrome --headless=new --window-size=1440,2400 --virtual-time-budget=8000 --screenshot=out.png http://localhost:3000/...`
- Recharts radar: `isAnimationActive={false}` (animation didn't render reliably).

## Phase 3c — Pipeline view replaces the radar (2026-10-17) ✅
User feedback: the polar radar was over-designed and hard to read; the site should be simple to navigate and speak to what
A'Pelago / Redstone operators need. Commit e1cc694.
- **Home (`/`)** = hero + **Pipeline**: `components/pipeline/portfolio-matrix.tsx` (2×2: x = readiness = mean(TRL, BRL, IRL),
  y = thesis fit; thresholds in `src/lib/quadrant.ts`: READY_AT 4.5, FIT_AT 0.75 → Investment-ready / Accelerate /
  Refer onwards / Monitor, copy in `components/pipeline/quadrants.ts`), quadrant explainer cards, `deadlines-panel.tsx`
  (funding calls within 120 days + which ventures match), `pipeline-table.tsx` (filters, search, readiness, score,
  best investor match, recommended next step; row → dossier).
- Queries: `getPipeline(lens)`, `getDeadlines(lens)` in `src/lib/queries.ts`. `quadrant.ts` is client-safe (no Supabase import).
- Header nav: Pipeline, Deadlines, "Assess a startup". Old `radar-board.tsx` removed.
- Intake page compacted to fit a 1440×900 screen.

## Phase 3d — Polish: deadlines, investor demand, flags, intake (2026-10-17) ✅
Commits 991eba3, 3ab59ce.
- Deadlines panel: compact 48px date chips (top-aligned), venture chips, natural height.
- New **Investors to activate** panel (`getInvestorDemand(lens)`): investors most often in ventures' top-3 matches.
- Matrix: collision-free label placement for the top-3 labelled ventures (tries right/left/below/above).
- **Countries**: `src/components/country.tsx` (≈45 countries, SVG flags via `country-flag-icons` — Windows can't render
  flag emoji; `Flag`, `CountryLabel`, `countryName`), `src/components/country-select.tsx` (searchable combobox: shadcn
  Popover + Command, Nordics & Baltics first). Flags + names used in pipeline table, dossier header, match cards.
- **Intake** (`/intake`): centred form (name, website, country picker, one-liner), example chips, compact 4-step row
  ABOVE the form (user: nobody scrolls). `intake-form.tsx` is a controlled client component posting to `/api/assess`.
- Known issue (open): user's browser showed the OLD intake form (plain "FI" text input) after a transient compile error
  ("Module not found: promise-score") broke HMR. Fresh headless Chrome renders the new form. Fix = hard refresh /
  restart dev server (`.next` cache) — see Phase 3e.

## State of the app (end of 2026-10-17 session)
- Pages: `/` (hero + pipeline matrix + deadlines + investors to activate + pipeline table), `/startups/[id]` (dossier),
  `/intake` (new venture), `/runs/[runId]` (live committee feed via Supabase Realtime).
- Data: all 22 seed startups assessed (Haiku/Sonnet mix) and stored in Supabase.
- Dev model: Haiku 5.5, effort low. Demo: set `RADAR_MODEL=anthropic/claude-sonnet-5-5`, `RADAR_EFFORT=medium`.
- Branch `dev`, nothing pushed. Commits have NO Claude co-author trailers (user rule).
- **Not yet done / next:** (1) verify country picker in the user's browser, (2) one live end-to-end run to verify the
  Realtime feed (costs ~1–2 cents on Haiku — ask user first), (3) Phase 4: CopilotKit copilot sidebar (Mastra radar agent
  with tools over the data + generative UI cards; see `knowledge-base/tech/mastra-copilotkit.md`), (4) `next build` check,
  (5) demo script. Dev server: `npm run dev`; visual QA via headless Chrome screenshots (command in Phase 3b).

## Phase 3e — Lens-aware investor framing (2026-10-17) ✅
User: "why investment opportunities for Redstone VC — Redstone itself is a VC?" → `INVESTOR_FRAMING` in `src/lib/lens.ts`:
- Redstone lens: lens owner (`redstone-blue`) is excluded from all investor lists (dossier, pipeline best match,
  demand panel); investors are framed as **Co-investors & follow-on** with tags *Co-invest now* (same stage, status ready)
  / *Next round* (later-stage funds). Table column "Best co-investor", panel "Co-investors to activate".
- A'Pelago lens: "Investors to introduce" / "Best investor intro". Custom lens: generic "Investors".
- Dev server was restarted with a clean `.next` to fix the user's stale intake form (old "FI" text input).
- Countries: now ALL 255 ISO countries. `scripts/gen-countries.ts` writes `src/lib/countries.ts` (code + English name
  via Intl.DisplayNames) and copies flag SVGs to `public/flags/` (served as static files, zero JS bundle cost).
  `country-flag-icons` is only a devDependency for that script. Picker groups: Nordics & Baltics, then all countries.
- Reminder: after a dev-server restart the user's open tab loses HMR → old client components; hard refresh (Ctrl+Shift+R).

## Phase 3f — Landing page + dashboard with sidebar (2026-10-17) ✅
User: keep the landing page, move pipeline/list into a dashboard with a proper sidebar (navigate without scrolling).
- **Route layout:**
  - `src/app/layout.tsx` — minimal shell (fonts, TooltipProvider, Toaster).
  - `src/app/(site)/layout.tsx` + `(site)/page.tsx` — landing: top header (`site-header.tsx`: "Assess a startup",
    "Open dashboard"), hero with stats, 4 feature cards, CTA to the dashboard.
  - `src/app/dashboard/layout.tsx` — shadcn **Sidebar** (`components/ui/sidebar.tsx`, `src/hooks/use-mobile.ts`) +
    `components/dashboard/app-sidebar.tsx` (Assess button, nav: Overview / Ventures / Deadlines / Co-investors|Investors,
    "Viewing as" thesis radio list, Back to site; collapsible to icons) + `components/dashboard/topbar.tsx`
    (sidebar trigger, page title, current lens).
- **Dashboard pages:** `/dashboard` Overview (4 KPI cards, matrix + quadrant cards, top-3 deadlines, co-investors to
  activate), `/dashboard/ventures` (pipeline table), `/dashboard/deadlines` (12-month horizon), `/dashboard/investors`
  (top 20 by demand), `/dashboard/assess` (intake), `/dashboard/startups/[id]` (dossier), `/dashboard/runs/[runId]`.
- Lens is still `?lens=` in the URL; the sidebar carries it on every link and switches it in place.
- Redirects in `next.config.ts`: `/startups/:id`, `/runs/:runId`, `/intake` → dashboard routes. Dev badge moved bottom-right.
- Removed: `lens-switcher.tsx` (replaced by the sidebar), unused Urbanist font.
- Moving route folders on Windows fails while `next dev` is running (file locks) — stop the server first.
- Sidebar refinement: "Viewing as" → **"Evaluate for"** with an ⓘ tooltip explaining the thesis; topbar shows
  "Evaluating for …". Compact, minimal sidebar: 15rem wide, 32px rows, 13px text, 15px icons, plain radio list.
  (The challenge explicitly asks for fit with an "investment or accelerator thesis".)
- **Bug fixed (thesis switch crashed):** `topbar.tsx` called `useSearchParams()` inside a `.find()` callback → hook count
  changed per lens ("Rendered more hooks than during the previous render"). Hooks now run at the top level.
  Regression check: puppeteer-core script (scratchpad) clicks each thesis in headless Chrome and asserts the URL,
  topbar and table column update — worth turning into a repo test if time allows.
- **Dashboard type scale reduced** (matches the compact sidebar): page h1 24px (`text-2xl`), section h2 20px, card titles
  and body `text-sm`, KPI numbers `text-2xl`, readiness numbers `text-3xl`, promise `text-4xl`, card padding `p-5`.
  Landing page keeps the larger marketing scale. Rule of thumb for new dashboard UI: body `text-sm`, labels `text-xs`.
- Matrix dots start at their final position (`initial={{ opacity: 0, x, y }}`) so they never flash at (0,0) before JS runs.

## Phase 3g — Overview redesign (2026-10-17) ✅
User: the 2×2 pipeline graph was not understandable; wanted something clear that stands out.
- **Removed** the readiness-vs-fit scatter (`portfolio-matrix.tsx` deleted). Quadrants still exist as groups/badges.
- **New Overview** (`src/app/dashboard/page.tsx`), answering three questions in order:
  1. `components/overview/stage-bar.tsx` — *Where the pipeline stands*: one segmented bar (Investment-ready /
     Accelerate / Refer onwards / Monitor) + plain-language legend; segments link to `/dashboard/ventures?group=…`
     (the table now accepts `initialFilter`).
  2. `components/overview/top-picks.tsx` — *Top picks*: 3 React Bits **SpotlightCard**s (light theme) with score ring,
     4 mini readiness bars, headline, best investor/co-investor, next move.
  3. `components/overview/weekly-moves.tsx` — *This week's moves*: portfolio-wide to-do list built server-side from
     urgent deadlines (≤45 days), the strongest warm intro paths (`getWarmPaths`, excludes paths into the lens owner),
     and the next step of the top ventures.
  Side column keeps Upcoming deadlines + Co-investors to activate.
- Data reveals that must not depend on JS (score rings, mini bars) use CSS keyframes (`.ring-fill`, `.bar-grow` in
  globals.css) with the final value inline — framer-motion `initial` values showed empty in slow loads.

## Phase 3h — Venture page restructure (2026-10-17) ✅
User: too much empty space, too much description; asked whether people would read it all (answer: no — operators
skim for a verdict in ~10–20 s; details are reference material for due diligence).
`src/app/dashboard/startups/[id]/page.tsx` now:
1. **Compact header card** — name + group badge + chips; description clamped to 2 lines (`components/expandable-text.tsx`,
   "Read more"); score ring (`ScoreRing` exported from overview/top-picks) + compact breakdown bars + Re-run.
2. **At a glance** row — Verdict (group / A'Pelago programme), Next move, Best co-investor / investor intro, Next
   deadline (or best rolling funding).
3. **Readiness** — 4 cards (rationale clamped to 2 lines, numbers rendered directly; CountUp removed because it showed 0 before JS).
4. **Tabs** (shadcn Tabs, `variant="line"`): Opportunities · Action plan · Connections (map + panel) · Deep dive
   (IRL radar, Ocean impact, evidence, team, sources).
- Venture page de-cluttered: more spacing (sections `space-y-8`, header `p-6`, glance cards `p-5`); readiness card
  simplified (confidence on the number line, no axis labels); opportunities show **top 3 per tab + "Show all N"**, max 3
  reason chips (small, muted). Website is a `components/website-button.tsx` pill (favicon via Google s2, domain,
  external icon, `target=_blank rel=noopener noreferrer`) in the name row.
- Screenshot QA now via puppeteer-core (`scratchpad/pptr/shot.mjs <url> <out> [height] [waitMs]`); Chrome's
  `--virtual-time-budget` hangs when a page loads remote images (favicons).

## Phase 3i — Assess + live run redesign, Scout fix (2026-10-17) ✅
- **Scout quality bug (found from the user's Clewat test):** on Haiku + low effort the researcher answered from memory →
  0 sources → TRL/BRL 1. Fix: Scout always runs at ≥ medium effort, instructions require ≥ 2 `web_search` calls, the
  pipeline retries once with a forcing prompt if no sources, and the feed shows an amber warning (`payload.warning =
  "no_sources"`) if research still comes back empty. Clewat should be re-assessed.
- **/dashboard/assess**: dashboard-style header, compact form (h-10 fields, country picker), right column "What you get"
  + **Recent assessments** (`getRecentRuns`, status + duration + link to venture/run).
- **/dashboard/runs/[runId]** (`components/live-run.tsx`): status card (current step, elapsed, progress bar; on finish:
  duration, score, group badge, "Open venture"), pipeline steps with each step's latest result, **Readiness tiles**
  as soon as the committee reports, live feed with status dots, amber warnings, auto-scroll and "Live" indicator.
- Final pipeline event now reads "score 58 for Redstone Blue VC · …" (thesis names, not ids).

## Cost note (2026-10-17)
- Total API spend reached ~$8: ~25 Sonnet 5.5 runs (first batch + the 20-startup retry batch, 11:38–12:33 Finnish time,
  web search + high-effort thinking ≈ $0.20–0.40/run). The retry batch kept running in the background after the user's
  $3 check. Since the Haiku switch (12:31) only 3 UI runs on Haiku (cents).
- `assessments.model` records which model produced each assessment (22 Sonnet, 2 Haiku at time of writing).
- Rule: no paid batch/re-run and no switch to Sonnet without the user's explicit OK + cost estimate. Recommend a monthly
  spend limit in the Anthropic Console.
- 3 runs stuck in `running` since the morning network outage were marked `error` ("Interrupted").
