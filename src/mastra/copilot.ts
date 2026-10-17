// Atlas copilot: the chat agent behind the dashboard drawer. Read-only tools over the radar data.
// Tool results are compact JSON; the chat renders them as cards (see components/copilot/tool-cards.tsx).
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { MAIN_MODEL } from "./agents";
import { getDeadlines, getDossier, getInvestorDemand, getPipeline, type PipelineRow } from "@/lib/queries";
import { INVESTOR_FRAMING, LENSES, PROGRAMMES, resolveLens } from "@/lib/lens";
import { SECTORS, type Sector } from "@/lib/taxonomy";
import { supabaseAdmin } from "@/lib/supabase/admin";

const lensInput = z
  .enum(LENSES.map((l) => l.id) as [string, ...string[]])
  .optional()
  .describe("Thesis to evaluate for. Use the lens from the app context; defaults to redstone-blue.");

const GROUP_LABEL = { invest: "Investment-ready", accelerate: "Accelerate", refer: "Refer onwards", monitor: "Monitor" } as const;
const round1 = (n: number | null | undefined) => (n == null ? null : Math.round(n * 10) / 10);
const cleanName = (n: string) => n.replace(/\s*\(.*\)$/, "");

function ventureRow(r: PipelineRow) {
  return {
    id: r.id,
    name: r.name,
    country: r.country,
    sector: r.sectors[0] ? SECTORS[r.sectors[0]] : null,
    stage: r.stage,
    score: r.promise == null ? null : Math.round(r.promise),
    thesisFit: r.thesisFit == null ? null : Math.round(r.thesisFit * 100),
    readiness: round1(r.readiness),
    group: r.quadrant ? GROUP_LABEL[r.quadrant] : null,
    levels: { trl: r.levels.trl ?? null, brl: r.levels.brl ?? null, oirl: r.levels.oirl ?? null, irl: r.levels.irl ?? null },
    oneLiner: r.oneLiner,
    topInvestor: r.topInvestor ? cleanName(r.topInvestor.name) : null,
    nextStep: r.nextStep?.title ?? null,
  };
}

/** Resolve a venture by id or (partial) name. */
async function resolveVenture(idOrName: string) {
  const { data } = await supabaseAdmin().from("startups").select("id,name");
  const q = idOrName.trim().toLowerCase();
  return (
    data?.find((s) => s.id === q) ??
    data?.find((s) => s.name.toLowerCase() === q) ??
    data?.find((s) => s.name.toLowerCase().includes(q) || s.id.includes(q.replace(/\s+/g, "-"))) ??
    null
  );
}

export const searchVentures = createTool({
  id: "searchVentures",
  description:
    "Search and rank ventures in the portfolio. Filter by free text, sector, country, group or minimum score. " +
    "Use for questions like 'top ocean energy startups', 'which ventures are investment-ready', 'Finnish startups'.",
  inputSchema: z.object({
    lens: lensInput,
    query: z.string().optional().describe("Free text matched against name, one-liner and sector"),
    sector: z.enum(Object.keys(SECTORS) as [Sector, ...Sector[]]).optional(),
    country: z.string().optional().describe("ISO-3166 alpha-2 code, e.g. FI, SE, NO"),
    group: z.enum(["invest", "accelerate", "refer", "monitor"]).optional().describe("Portfolio group"),
    minScore: z.number().optional().describe("Minimum overall score 0-100"),
    sortBy: z.enum(["score", "readiness", "fit"]).optional(),
    limit: z.number().int().min(1).max(12).optional(),
  }),
  execute: async (input) => {
    const lens = resolveLens(input.lens);
    let rows = (await getPipeline(lens)).filter((r) => r.assessed);
    if (input.query) {
      const q = input.query.toLowerCase();
      rows = rows.filter((r) =>
        [r.name, r.oneLiner ?? "", ...r.sectors.map((s) => SECTORS[s])].join(" ").toLowerCase().includes(q),
      );
    }
    if (input.sector) rows = rows.filter((r) => r.sectors.includes(input.sector!));
    if (input.country) rows = rows.filter((r) => r.country?.toUpperCase() === input.country!.toUpperCase());
    if (input.group) rows = rows.filter((r) => r.quadrant === input.group);
    if (input.minScore != null) rows = rows.filter((r) => (r.promise ?? 0) >= input.minScore!);
    const key = input.sortBy ?? "score";
    const val = (r: PipelineRow) => (key === "readiness" ? r.readiness : key === "fit" ? r.thesisFit : r.promise) ?? -1;
    rows.sort((a, b) => val(b) - val(a));
    return { lens, total: rows.length, ventures: rows.slice(0, input.limit ?? 6).map(ventureRow) };
  },
});

export const getVenture = createTool({
  id: "getVenture",
  description:
    "Full snapshot of one venture: readiness levels with reasons, overall score, best investors, funding and partners, " +
    "hidden connections and the next actions. Accepts the venture id or name.",
  inputSchema: z.object({ venture: z.string().describe("Venture id (e.g. 'kelluu') or name"), lens: lensInput }),
  execute: async ({ venture, lens: l }) => {
    const lens = resolveLens(l);
    const hit = await resolveVenture(venture);
    if (!hit) return { error: `No venture called "${venture}" in Atlas.` };
    const d = await getDossier(hit.id, lens);
    if (!d) return { error: `No venture called "${venture}" in Atlas.` };
    const lv = (f: "trl" | "brl" | "oirl" | "irl") => {
      const a = d.assessments[f];
      return a ? { level: a.level, confidence: a.confidence, why: a.rationale?.slice(0, 280) ?? null, gaps: (a.gaps ?? []).slice(0, 3) } : null;
    };
    const top = (t: "investor" | "funding" | "partner") =>
      d.matches
        .filter((m) => m.targetType === t)
        .slice(0, 3)
        .map((m) => ({ name: cleanName(m.target.name), fit: Math.round(m.fit * 100), status: m.status, why: m.reasons.slice(0, 2) }));
    return {
      lens,
      id: d.startup.id,
      name: d.startup.name,
      oneLiner: d.startup.one_liner,
      country: d.startup.country,
      stage: d.startup.stage,
      sectors: d.startup.sectors.map((s) => SECTORS[s]),
      website: d.startup.website,
      score: d.score ? Math.round(d.score.promise) : null,
      thesisFit: d.score ? Math.round(d.score.thesis_fit * 100) : null,
      headline: d.score?.headline ?? null,
      programme: d.score?.programme ? PROGRAMMES[d.score.programme] ?? d.score.programme : null,
      levels: { trl: lv("trl"), brl: lv("brl"), oirl: lv("oirl"), irl: lv("irl") },
      investorsLabel: INVESTOR_FRAMING[lens].tab,
      investors: top("investor"),
      funding: top("funding"),
      partners: top("partner"),
      connections: d.connections.slice(0, 6).map(connectionRow),
      actions: d.actions.slice(0, 4).map((a) => ({ when: a.horizon, title: a.title, owner: a.owner })),
    };
  },
});

export const compareVentures = createTool({
  id: "compareVentures",
  description: "Compare 2–4 ventures side by side on score, thesis fit, readiness levels, group and best investor.",
  inputSchema: z.object({ ventures: z.array(z.string()).min(2).max(4).describe("Venture ids or names"), lens: lensInput }),
  execute: async ({ ventures, lens: l }) => {
    const lens = resolveLens(l);
    const rows = await getPipeline(lens);
    const found = await Promise.all(ventures.map(resolveVenture));
    const missing = ventures.filter((_, i) => !found[i]);
    return {
      lens,
      missing,
      ventures: found.flatMap((f) => {
        const r = f && rows.find((x) => x.id === f.id);
        return r ? [ventureRow(r)] : [];
      }),
    };
  },
});

type ConnRow = { startup_id?: string; kind: string; title: string; narrative: string | null; score: number | null; payload: Record<string, unknown> };
function connectionRow(c: ConnRow) {
  const hops = (c.payload.hops as { name: string }[] | undefined)?.map((h) => cleanName(h.name)) ?? null;
  return { kind: c.kind, title: c.title, path: hops, detail: c.narrative?.slice(0, 220) ?? null, strength: c.score == null ? null : round1(c.score) };
}

export const findConnections = createTool({
  id: "findConnections",
  description:
    "Hidden connections from the relationship graph: warm intro paths to investors, consortia for grant calls, " +
    "synergies between ventures and milestones that unlock new opportunities. Use for any question about warm paths, " +
    "intros, 'who can introduce us', 'how do we reach <investor>', consortia or partners. " +
    "Give a venture for its connections, and/or an investor name to find warm paths into that investor across the portfolio.",
  inputSchema: z.object({
    venture: z.string().optional().describe("Venture id or name"),
    investor: z.string().optional().describe("Investor name, e.g. 'Redstone Blue', 'Katapult'"),
    kind: z.enum(["warm_path", "consortium", "synergy", "unlock", "deadline"]).optional(),
  }),
  execute: async ({ venture, investor, kind }) => {
    const db = supabaseAdmin();
    let q = db.from("connections").select("startup_id,kind,title,narrative,score,payload").order("score", { ascending: false });
    let ventureName: string | null = null;
    if (venture) {
      const hit = await resolveVenture(venture);
      if (!hit) return { error: `No venture called "${venture}" in Atlas.`, connections: [] };
      q = q.eq("startup_id", hit.id);
      ventureName = hit.name;
    }
    if (investor) q = q.eq("kind", "warm_path");
    else if (kind) q = q.eq("kind", kind);
    const [{ data }, { data: names }] = await Promise.all([q.limit(200), db.from("startups").select("id,name")]);
    let rows = (data ?? []) as ConnRow[];
    if (investor) {
      const t = investor.toLowerCase();
      rows = rows.filter((c) => {
        const hops = (c.payload.hops as { name: string }[] | undefined) ?? [];
        return hops.at(-1)?.name.toLowerCase().includes(t) || String(c.payload.investor_id ?? "").includes(t.replace(/\s+/g, "-"));
      });
    }
    return {
      venture: ventureName,
      investor: investor ?? null,
      total: rows.length,
      connections: rows.slice(0, 8).map((c) => ({
        ...connectionRow(c),
        ventureId: c.startup_id,
        ventureName: names?.find((n) => n.id === c.startup_id)?.name ?? c.startup_id,
      })),
    };
  },
});

export const upcomingDeadlines = createTool({
  id: "upcomingDeadlines",
  description: "Funding calls closing soon, with the ventures that match each call.",
  inputSchema: z.object({ lens: lensInput, days: z.number().int().min(7).max(365).optional().describe("Horizon in days, default 120") }),
  execute: async ({ lens: l, days }) => {
    const lens = resolveLens(l);
    const rows = await getDeadlines(lens, days ?? 120);
    return {
      lens,
      deadlines: rows.slice(0, 8).map((d) => ({
        name: d.name,
        provider: d.provider,
        date: d.date,
        daysLeft: d.days,
        amountEur: d.amount,
        ventures: d.eligible.slice(0, 4).map((e) => ({ id: e.id, name: e.name, status: e.status })),
      })),
    };
  },
});

export const findInvestors = createTool({
  id: "findInvestors",
  description:
    "Search the investor database (VCs, CVCs, public investors) by sector, stage, region or name, and show how many " +
    "portfolio ventures each one is a top match for. Also use for 'which investors should we activate'.",
  inputSchema: z.object({
    lens: lensInput,
    query: z.string().optional().describe("Name or thesis text"),
    sector: z.enum(Object.keys(SECTORS) as [Sector, ...Sector[]]).optional(),
    stage: z.enum(["research", "pre_seed", "seed", "series_a", "series_b_plus", "growth"]).optional(),
    limit: z.number().int().min(1).max(10).optional(),
  }),
  execute: async (input) => {
    const lens = resolveLens(input.lens);
    const [{ data }, demand] = await Promise.all([supabaseAdmin().from("investors").select("*"), getInvestorDemand(lens, 50)]);
    const owner = INVESTOR_FRAMING[lens].ownerId;
    const ownerRow = data?.find((i) => i.id === owner);
    const ownerHit = !!(input.query && ownerRow && ownerRow.name.toLowerCase().includes(input.query.toLowerCase()));
    let rows = (data ?? []).filter((i) => i.id !== owner);
    if (input.query) {
      const q = input.query.toLowerCase();
      rows = rows.filter((i) => `${i.name} ${i.thesis ?? ""} ${i.hq ?? ""}`.toLowerCase().includes(q));
    }
    if (input.sector) rows = rows.filter((i) => (i.sectors as string[]).includes(input.sector!));
    if (input.stage) rows = rows.filter((i) => (i.stages as string[]).includes(input.stage!));
    const matched = (id: string) => demand.find((d) => d.id === id)?.ventures ?? [];
    rows.sort((a, b) => matched(b.id).length - matched(a.id).length);
    return {
      lens,
      note: ownerHit ? `${cleanName(ownerRow!.name)} is the fund the user evaluates for, so it is not listed as an investor match. Use findConnections for warm paths into it.` : undefined,
      total: rows.length,
      investors: rows.slice(0, input.limit ?? 6).map((i) => ({
        name: cleanName(i.name),
        type: i.type,
        hq: i.hq,
        stages: i.stages,
        ticket: i.ticket_min_eur || i.ticket_max_eur ? [i.ticket_min_eur, i.ticket_max_eur] : null,
        website: i.website,
        matchedVentures: matched(i.id).map((v) => v.name),
      })),
    };
  },
});

// What the platform is and how it works (for "explain the platform" questions). Counts are live.
const PIPELINE = [
  { step: "Scout", what: "Researches the startup on the web (site, press, funding, customers) and builds an evidence-backed profile." },
  { step: "Readiness review", what: "Four AI assessors score TRL, BRL, Ocean Impact (OIRL) and Investment readiness (IRL) in parallel; a separate Second Opinion model double-checks each level and flags disagreements for human review." },
  { step: "Matchmaker", what: "Ranks every investor, funding programme and partner/client by sector, stage, geography, ticket size and readiness gates." },
  { step: "Connector", what: "Searches the relationship graph for hidden connections: warm intro paths, grant consortia, synergies between ventures and milestones that unlock new matches." },
  { step: "Match Narrator", what: "Writes a short reason for each top match." },
  { step: "Strategist", what: "Turns it all into a prioritised action plan (now / 30 days / 90 days) with owners and deadlines." },
];
const PAGES = [
  { page: "Overview", what: "Where the pipeline stands, top picks, this week's moves, upcoming deadlines and investors to activate." },
  { page: "Ventures", what: "Every venture with score, readiness and group; filter by group." },
  { page: "Venture page", what: "One startup: score breakdown, readiness levels with reasoning, opportunities (investors, funding, partners), action plan, connections map and deep dive." },
  { page: "Deadlines", what: "Funding calls closing soon and which ventures should apply." },
  { page: "Investors / Co-investors", what: "Which investors are matched most often across the portfolio." },
  { page: "Guide", what: "A plain-language explanation of the whole platform with links to every page (/dashboard/guide). Share it with new users." },
  { page: "Assess a startup", what: "Add any startup by name or website; the Deep Panel (Atlas's AI agent team) assesses it live in about a minute." },
];

export const explainPlatform = createTool({
  id: "explainPlatform",
  description:
    "Explains A'Pelago Atlas itself (the platform the user is in): what it is for, the questions it answers, how the Deep Panel (the AI agent team) works, " +
    "the readiness scales, how scores and groups are calculated, the theses and what each page does. " +
    "Use for 'what is this', 'explain the platform', 'how does it work', 'how is the score calculated'.",
  inputSchema: z.object({ lens: lensInput }),
  execute: async ({ lens: l }) => {
    const lens = resolveLens(l);
    const db = supabaseAdmin();
    const count = async (t: string) => (await db.from(t).select("*", { count: "exact", head: true })).count ?? 0;
    const [ventures, investors, funding, partners, relationships, thesis] = await Promise.all([
      count("startups"), count("investors"), count("funding"), count("partners"), count("relationships"),
      db.from("theses").select("name,description,config").eq("id", lens).maybeSingle(),
    ]);
    const w = (thesis.data?.config as { promise_weights?: Record<string, number> } | undefined)?.promise_weights;
    return {
      lens,
      purpose:
        "Turns fragmented startup and ecosystem data into venture intelligence for A'Pelago (accelerator) and Redstone Blue (VC): " +
        "which ocean startups are most promising, why they fit a thesis, how ready they are, who to connect them with next, and what to do now.",
      answers: [
        "Which startups are most promising",
        "Why, and how they fit the investment or accelerator thesis",
        "Their technology, business, ocean impact and investment readiness",
        "Which investors, funding, partners and clients are relevant next, in priority order",
        "What they should do next",
      ],
      data: { ventures, investors, funding, partners, relationships },
      pipeline: PIPELINE,
      scales: {
        TRL: "Technology Readiness Level 1–9 (EU scale): from idea to proven in operations.",
        BRL: "Business Readiness Level 1–9 (KTH): from hypothesis to scaling sales.",
        OIRL: "Ocean Impact Readiness 1–9, based on the Ocean Impact Navigator (6 impact areas, 30 KPIs).",
        IRL: "Investment Readiness 1–9 from a weighted 10-dimension rubric (team, market, product, traction, deal…).",
      },
      score: {
        what: "Overall score 0–100 for the selected thesis.",
        weights: w ? Object.fromEntries(Object.entries(w).map(([k, v]) => [k, `${Math.round(v * 100)}%`])) : null,
      },
      groups: {
        "Investment-ready": "Fits the thesis and mature enough for a round (readiness ≥ 4.5, fit ≥ 75%).",
        Accelerate: "Fits the thesis but early: programme candidates.",
        "Refer onwards": "Mature but off-thesis: introduce to better-fitting investors.",
        Monitor: "Early and off-thesis: revisit later.",
      },
      theses: LENSES.map((x) => `${x.label} (${x.kind})`),
      currentThesis: thesis.data?.name ?? lens,
      pages: PAGES,
    };
  },
});

export const portfolioOverview = createTool({
  id: "portfolioOverview",
  description: "Portfolio-level summary: how many ventures per group, average readiness levels, top 3 and sector mix.",
  inputSchema: z.object({ lens: lensInput }),
  execute: async ({ lens: l }) => {
    const lens = resolveLens(l);
    const rows = (await getPipeline(lens)).filter((r) => r.assessed);
    const avg = (f: "trl" | "brl" | "oirl" | "irl") => {
      const v = rows.map((r) => r.levels[f]).filter((x): x is number => x != null);
      return v.length ? round1(v.reduce((a, b) => a + b, 0) / v.length) : null;
    };
    const sectors = new Map<string, number>();
    for (const r of rows) if (r.sectors[0]) sectors.set(SECTORS[r.sectors[0]], (sectors.get(SECTORS[r.sectors[0]]) ?? 0) + 1);
    return {
      lens,
      ventures: rows.length,
      groups: Object.fromEntries(
        (["invest", "accelerate", "refer", "monitor"] as const).map((g) => [GROUP_LABEL[g], rows.filter((r) => r.quadrant === g).length]),
      ),
      averageLevels: { trl: avg("trl"), brl: avg("brl"), oirl: avg("oirl"), irl: avg("irl") },
      top: rows.slice(0, 3).map(ventureRow),
      sectors: [...sectors.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    };
  },
});

const COPILOT_INSTRUCTIONS = `You are Atlas, the assistant inside A'Pelago Atlas, a venture-intelligence platform for
A'Pelago (Baltic blue-economy accelerator) and Redstone Blue (blue-economy VC). Users are investment and accelerator
professionals. Answer questions about the startups, readiness levels, investors, funding calls and next steps.

How to work:
- Questions about "this page" (summarise it, what is this, what am I looking at): answer in text from the
  "currentPage" context. Call a tool only if the answer needs live data (ventures, scores, investors, deadlines).
- On the Guide page, or for conceptual questions (what a level, score or warm path means), answer in plain text
  and do NOT call tools: the guide already shows the details, so cards would just repeat it.
- Facts about ventures, investors, funding and deadlines always come from the tools; never invent them.
- Questions about the platform itself ("what is this", "explain Atlas", "how is the score calculated") → explainPlatform.
- Warm paths, intros, "who can introduce", consortia, synergies → findConnections (pass the venture and/or investor).
- Use the "lens" (thesis) from the app context in every tool call. Scores and matches depend on it.
- If the user is on a venture page ("this startup", "it", "here"), use the venture from the app context.
- The tool results are shown to the user as cards, so do not repeat what the card shows. Keep answers short:
  2–4 sentences or up to 4 bullets: the insight, why, and one concrete next step. Plain words.
- If a tool returns nothing, say so in one sentence and suggest the closest useful question. Never speculate.
- To open a venture page or switch the thesis, call the frontend tools openVenture / switchLens when the user asks.

The team of AI agents that assesses each venture is called the Deep Panel (Scout, readiness assessors with a Second Opinion
model, Matchmaker, Connector, Match Narrator, Strategist). Always call it the Deep Panel, never a committee.

Scales: TRL = technology readiness, BRL = business readiness, OIRL = ocean impact readiness, IRL = investment readiness
(all 1–9). Score = overall promise 0–100 for the chosen thesis. Groups: Investment-ready (fits thesis, mature),
Accelerate (fits thesis, early), Refer onwards (mature, off-thesis), Monitor (early, off-thesis).`;

export const radarCopilot = new Agent({
  id: "radar-copilot",
  name: "Atlas",
  // The app context (lens, page, open venture) arrives via AG-UI in requestContext["ag-ui"]; append it to the prompt.
  instructions: ({ requestContext }) => {
    const ctx = (requestContext?.get("ag-ui") as { context?: { description: string; value: string }[] } | undefined)?.context ?? [];
    return COPILOT_INSTRUCTIONS + ctx.map((c) => `\n\n## ${c.description}\n${c.value}`).join("");
  },
  model: () => anthropic(MAIN_MODEL),
  tools: { explainPlatform, searchVentures, getVenture, compareVentures, findConnections, upcomingDeadlines, findInvestors, portfolioOverview },
});
