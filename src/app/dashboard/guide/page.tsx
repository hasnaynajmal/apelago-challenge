import type { Metadata } from "next";
import {
  ArrowRight, BookOpen, CalendarClock, Compass, Gauge, Landmark, LayoutDashboard, MessageSquareText, Network,
  Plus, Route, Rows3, ScanSearch, Sparkles, Target, Users,
} from "lucide-react";
import { LensLink } from "@/components/guide/lens-link";

export const metadata: Metadata = {
  title: "Guide · A'Pelago Atlas",
  description: "How A'Pelago Atlas works, in plain words, and how to find your way around it.",
};

const SECTIONS = [
  { id: "minute", label: "Atlas in one minute" },
  { id: "tour", label: "Quick tour" },
  { id: "venture", label: "Reading a venture page" },
  { id: "levels", label: "The four readiness levels" },
  { id: "score", label: "Score and groups" },
  { id: "thesis", label: "Evaluate for (theses)" },
  { id: "panel", label: "How an assessment works" },
  { id: "connections", label: "Hidden connections" },
  { id: "ask", label: "Ask Atlas" },
  { id: "data", label: "Data and limits" },
  { id: "glossary", label: "Glossary" },
];

const QUESTIONS = [
  { q: "Which startups are most promising?", where: "Overview → Top picks, and the score on every venture", href: "/dashboard" },
  { q: "Why, and how do they fit our thesis?", where: "Venture page → score breakdown and verdict", href: "/dashboard/ventures" },
  { q: "How ready are they?", where: "Venture page → the four readiness cards", href: "/dashboard/ventures" },
  { q: "Who should they meet next?", where: "Venture page → Opportunities and Connections", href: "/dashboard/ventures" },
  { q: "What should they do next?", where: "Venture page → Action plan, and Overview → This week's moves", href: "/dashboard" },
];

const TOUR = [
  { icon: LayoutDashboard, title: "Overview", href: "/dashboard", text: "The start page. How the pipeline splits into four groups, the three most promising ventures, this week's to-do list, upcoming deadlines and the investors worth calling." },
  { icon: Rows3, title: "Ventures", href: "/dashboard/ventures", text: "Every startup in one table with its score, readiness and group. Click a group on the Overview to see only those ventures. Click a row to open the venture." },
  { icon: Target, title: "Venture page", href: "/dashboard/startups/oxyle", text: "Everything about one startup: score, verdict, readiness, who to introduce it to, the action plan and hidden connections." },
  { icon: CalendarClock, title: "Deadlines", href: "/dashboard/deadlines", text: "Grant and funding calls closing soon, and which ventures should apply to each one." },
  { icon: Landmark, title: "Co-investors / Investors", href: "/dashboard/investors", text: "The investors matched most often across the portfolio: the relationships worth activating first." },
  { icon: Plus, title: "Assess a startup", href: "/dashboard/assess", text: "Add any startup by name (website and country help). Atlas researches and scores it live in about a minute." },
];

const LEVELS = [
  { short: "TRL", name: "Technology readiness", color: "#0891b2", q: "Does the technology work?", low: "an idea or lab test", mid: "a prototype tested at sea or at a pilot site", high: "a product in daily use at customers" },
  { short: "BRL", name: "Business readiness", color: "#2563eb", q: "Is there a business?", low: "a hypothesis about a market", mid: "pilots, letters of intent, first pricing", high: "paying customers and repeat sales" },
  { short: "OIRL", name: "Ocean impact readiness", color: "#059669", q: "Does it help the ocean, and can it prove it?", low: "a claimed benefit", mid: "a clear mechanism and defined impact KPIs", high: "measured, independently verified impact" },
  { short: "IRL", name: "Investment readiness", color: "#a87c12", q: "Is it ready for investors?", low: "early team, no clear case", mid: "credible team, market and plan", high: "a fundable company with traction and a clean deal" },
];

const WEIGHTS = [
  { thesis: "Redstone Blue VC", w: { "Investment readiness": 35, "Thesis fit": 25, "Ocean impact": 20, Momentum: 10, Team: 10 } },
  { thesis: "A'Pelago Accelerator", w: { "Investment readiness": 20, "Thesis fit": 25, "Ocean impact": 30, Momentum: 10, Team: 15 } },
  { thesis: "Custom (Nordic climate)", w: { "Investment readiness": 45, "Thesis fit": 30, "Ocean impact": 5, Momentum: 10, Team: 10 } },
];
const WEIGHT_COLORS = ["#002444", "#2563eb", "#059669", "#0891b2", "#a87c12"];

const GROUPS = [
  { name: "Investment-ready", dot: "#059669", text: "Fits the thesis and is mature enough for a round. Make investor intros." },
  { name: "Accelerate", dot: "#002444", text: "Fits the thesis but is still early. A good candidate for an A'Pelago programme." },
  { name: "Refer onwards", dot: "#d97706", text: "Mature, but outside this thesis. Introduce it to investors who fit better." },
  { name: "Monitor", dot: "#a1a1aa", text: "Early and outside the thesis. Check again when there is new traction." },
];

const PANEL = [
  { name: "Scout", text: "Searches the web (company site, press, funding news) and writes an evidence-backed profile with sources." },
  { name: "Readiness review", text: "Four AI assessors score TRL, BRL, ocean impact and investment readiness at the same time." },
  { name: "Second Opinion", text: "A separate model scores the same evidence independently. If it clearly disagrees, the level gets a Review flag for a human to check." },
  { name: "Matchmaker", text: "Ranks every investor, grant and partner by sector, stage, country, ticket size and readiness requirements." },
  { name: "Connector", text: "Looks through the relationship network for warm intro paths, grant consortia, synergies and milestones that unlock new matches." },
  { name: "Narrator + Strategist", text: "Explain the top matches in one or two sentences each and turn everything into a prioritised action plan." },
];

const ASK = [
  "How does Atlas work?",
  "Which 5 ventures are most promising for our thesis?",
  "Summarise this venture and tell me if we should act now.",
  "What's the warm path to Redstone Blue for Oxyle?",
  "Compare NPHarvest, Oxyle and Caudal Energy.",
  "Which funding deadlines close in the next 30 days, and who should apply?",
];

const GLOSSARY = [
  ["Thesis", "The criteria an investor or accelerator uses to pick startups (sectors, stage, region, ticket size, impact)."],
  ["Thesis fit", "How well a venture matches the selected thesis, 0–100%."],
  ["Warm intro path", "A chain of real relationships (partner, programme, LP) that leads from a venture to an investor."],
  ["Consortium", "A group of companies and research partners applying for a grant together."],
  ["Unlock", "A milestone (e.g. a field trial) that would make new investors or grants available."],
  ["Co-investor", "Another fund that could invest in the same round as Redstone, or in the next one."],
  ["Deep Panel", "Atlas's team of AI agents that researches and assesses each venture."],
  ["Second Opinion", "An independent model that double-checks every readiness level."],
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        <article className="min-w-0 space-y-14 text-[15px] leading-7 text-zinc-700">
          {/* Hero */}
          <header>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-navy-soft px-2.5 py-0.5 text-xs font-medium text-navy">
              <BookOpen className="size-3.5" /> Guide
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">How A&apos;Pelago Atlas works</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              A plain-language guide for the A&apos;Pelago and Redstone Blue teams: what Atlas does, how to read it and where to click.
              Reading time: about 5 minutes.
            </p>
          </header>

          <Section id="minute" title="Atlas in one minute">
            <p>
              Information about ocean startups is scattered across websites, news, grant databases and people&apos;s heads.
              Atlas pulls it together and turns it into decisions: <b className="font-semibold text-foreground">which startups to back or accelerate, why, and what to do next</b>.
            </p>
            <p>For every venture, Atlas answers five questions:</p>
            <ol className="mt-1 divide-y rounded-xl border bg-white">
              {QUESTIONS.map((x, i) => (
                <li key={x.q}>
                  <LensLink href={x.href} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-50">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-foreground">{x.q}</span>
                      <span className="block text-sm text-muted-foreground">{x.where}</span>
                    </span>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-navy" />
                  </LensLink>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="tour" title="Quick tour" sub="Everything is in the left sidebar. Click a card to jump there.">
            <div className="grid gap-3 sm:grid-cols-2">
              {TOUR.map((t) => (
                <LensLink key={t.title} href={t.href} className="card-surface card-hover group block p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-navy-soft text-navy"><t.icon className="size-4" /></span>
                    <span className="font-semibold text-foreground">{t.title}</span>
                    <ArrowRight className="ml-auto size-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-navy" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.text}</p>
                </LensLink>
              ))}
            </div>
            <Tip icon={MessageSquareText} title="Ask Atlas (top right, or Ctrl + J)">
              A chat assistant that answers questions about the data and knows which page you are on. See <a href="#ask" className="font-medium text-navy hover:underline">Ask Atlas</a>.
            </Tip>
          </Section>

          <Section id="venture" title="Reading a venture page" sub="Read it top to bottom: the further down, the more detail.">
            <Steps
              items={[
                ["Header", "Name, group badge, location, stage and sectors, a short description and the website. On the right: the overall score for the selected thesis and what it is made of."],
                ["At a glance", "Four cards: the verdict (which group and what that means), the next move, the best investor match and the next funding deadline."],
                ["Readiness", "The four levels from 1 to 9 with how confident the assessment is. Click \"Why this level\" to see the reasoning, what is needed to reach the next level and what evidence is missing. A yellow Review badge means the Second Opinion disagrees and a human should check."],
                ["Opportunities", "Investors, grants and partners ranked for this venture, each with a fit percentage, the reasons and anything blocking it (for example \"needs TRL 6 first\")."],
                ["Action plan", "Concrete next steps for the startup and for your team, ordered by deadlines and by what they unlock."],
                ["Connections", "A map of the venture's ecosystem plus warm intro paths, consortia, synergies and unlocks."],
                ["Deep dive", "The investment-readiness breakdown (team, market, product…), ocean impact areas and KPIs, and the sources."],
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <ExampleLink href="/dashboard/startups/oxyle">Example: Oxyle</ExampleLink>
              <ExampleLink href="/dashboard/startups/npharvest">Example: NPHarvest</ExampleLink>
            </div>
          </Section>

          <Section id="levels" title="The four readiness levels" sub="All four use a 1–9 scale. Roughly: 1–3 early, 4–6 testing, 7–9 proven.">
            <div className="grid gap-3 sm:grid-cols-2">
              {LEVELS.map((l) => (
                <div key={l.short} className="card-surface p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-foreground">{l.name}</span>
                    <span className="text-sm font-semibold" style={{ color: l.color }}>{l.short}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{l.q}</p>
                  <div className="mt-3 flex h-1.5 overflow-hidden rounded-full">
                    {[0.25, 0.55, 1].map((o, i) => <div key={i} className="flex-1" style={{ background: l.color, opacity: o }} />)}
                  </div>
                  <dl className="mt-3 space-y-1 text-sm leading-6">
                    <Row k="1–3" v={l.low} />
                    <Row k="4–6" v={l.mid} />
                    <Row k="7–9" v={l.high} />
                  </dl>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on recognised frameworks: TRL (EU), BRL (KTH Innovation Readiness Level), ocean impact (Ocean Impact Navigator by
              1000 Ocean Startups) and a 10-part investment readiness checklist.
            </p>
          </Section>

          <Section id="score" title="Score and groups">
            <p>
              The <b className="font-semibold text-foreground">score (0–100)</b> says how promising a venture is <i>for the thesis you selected</i>.
              It mixes five things, weighted differently per thesis:
            </p>
            <div className="space-y-3 rounded-xl border bg-white p-4">
              {WEIGHTS.map((t) => (
                <div key={t.thesis}>
                  <div className="text-sm font-medium text-foreground">{t.thesis}</div>
                  <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full">
                    {Object.entries(t.w).map(([k, v], i) => <div key={k} title={`${k} ${v}%`} style={{ width: `${v}%`, background: WEIGHT_COLORS[i] }} />)}
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                {Object.keys(WEIGHTS[0].w).map((k, i) => (
                  <span key={k} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: WEIGHT_COLORS[i] }} />{k}</span>
                ))}
              </div>
            </div>
            <p>
              Each venture also lands in one of <b className="font-semibold text-foreground">four groups</b>, based on two questions: does it fit the thesis
              (fit of 75% or more), and is it mature (average of technology, business and investment readiness of 4.5 or more)?
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {GROUPS.map((g) => (
                <div key={g.name} className="flex gap-2.5 rounded-xl border bg-white p-3">
                  <span className="mt-2 size-2.5 shrink-0 rounded-full" style={{ background: g.dot }} />
                  <div>
                    <div className="font-medium text-foreground">{g.name}</div>
                    <div className="text-sm leading-6 text-muted-foreground">{g.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="thesis" title="Evaluate for (theses)">
            <p>
              In the sidebar, <b className="font-semibold text-foreground">Evaluate for</b> picks whose criteria Atlas uses: Redstone Blue&apos;s fund thesis,
              A&apos;Pelago&apos;s accelerator criteria, or a custom thesis. Switching changes the scores, the groups, the ranking and how investors
              are presented:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li><b className="font-medium text-foreground">Redstone Blue:</b> other funds are shown as <i>co-investors</i> or follow-on investors (Redstone never matches itself).</li>
              <li><b className="font-medium text-foreground">A&apos;Pelago:</b> investors are shown as <i>investors to introduce</i>, and each venture gets a recommended programme.</li>
              <li><b className="font-medium text-foreground">Custom:</b> an example of how any investor&apos;s thesis can be plugged in.</li>
            </ul>
          </Section>

          <Section id="panel" title="How an assessment works" sub="Done by the Deep Panel, Atlas's team of AI agents. Takes about a minute.">
            <ol className="relative space-y-4 border-l border-dashed pl-6">
              {PANEL.map((p, i) => (
                <li key={p.name} className="relative">
                  <span className="absolute -left-[35px] flex size-5 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">{i + 1}</span>
                  <div className="font-semibold text-foreground">{p.name}</div>
                  <p className="text-sm leading-6 text-muted-foreground">{p.text}</p>
                </li>
              ))}
            </ol>
            <Tip icon={ScanSearch} title="Try it">
              Go to <LensLink href="/dashboard/assess" className="font-medium text-navy hover:underline">Assess a startup</LensLink>, click an example
              and press Run. You can watch every agent work in the live feed; the venture page opens by itself when it is done.
            </Tip>
          </Section>

          <Section id="connections" title="Hidden connections" sub="The things a spreadsheet would not show you.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Mini icon={Route} title="Warm intro paths" text="Chains like Venture → partner → A'Pelago → investor, so an intro comes through someone the investor already knows." />
              <Mini icon={Users} title="Consortia" text="Ready-made teams (venture + research institute + industry partner) for grant calls that require a consortium." />
              <Mini icon={Network} title="Synergies" text="Ventures in the portfolio that complement each other, e.g. one's output is another's input." />
              <Mini icon={Sparkles} title="Unlocks" text="Milestones that would open new opportunities, e.g. 'a field trial unlocks 4 more investors'." />
            </div>
          </Section>

          <Section id="ask" title="Ask Atlas" sub="Open it with the Ask Atlas button (top right) or Ctrl + J.">
            <p>
              Ask in normal language. Atlas answers from the platform&apos;s data and shows the results as cards you can click.
              On a venture page, &quot;this startup&quot; means the one you are looking at. It can also open pages and switch the thesis for you.
            </p>
            <div className="flex flex-wrap gap-2">
              {ASK.map((q) => (
                <span key={q} className="rounded-full border bg-white px-3 py-1 text-sm text-zinc-700">&ldquo;{q}&rdquo;</span>
              ))}
            </div>
          </Section>

          <Section id="data" title="Data and limits">
            <ul className="list-disc space-y-1.5 pl-5">
              <li><b className="font-medium text-foreground">Startups:</b> A&apos;Pelago accelerator alumni, the EU Blue Economy Observatory, and any startup you add.</li>
              <li><b className="font-medium text-foreground">Ecosystem:</b> curated lists of ocean and climate investors, EU and Nordic grant programmes, and corporate, research and public partners, plus the known relationships between them.</li>
              <li><b className="font-medium text-foreground">Research:</b> public web sources found by the Scout. Sources are listed on each venture&apos;s Deep dive tab.</li>
              <li><b className="font-medium text-foreground">Limits:</b> assessments are only as good as public evidence. Low confidence or a Review badge means: check before acting. Atlas supports decisions, it does not make them.</li>
            </ul>
          </Section>

          <Section id="glossary" title="Glossary">
            <dl className="divide-y rounded-xl border bg-white">
              {GLOSSARY.map(([k, v]) => (
                <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr]">
                  <dt className="font-medium text-foreground">{k}</dt>
                  <dd className="text-sm leading-6 text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-navy p-6 text-white">
            <Compass className="size-6 text-gold" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Ready to explore?</div>
              <div className="text-sm text-white/70">Start with the Overview, or add a startup and watch the Deep Panel work.</div>
            </div>
            <LensLink href="/dashboard" className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-navy hover:bg-white/90">Open Overview</LensLink>
            <LensLink href="/dashboard/assess" className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10">Assess a startup</LensLink>
          </div>
        </article>

        {/* Contents */}
        <nav className="hidden lg:block">
          <div className="sticky top-20">
            <div className="text-xs font-medium text-muted-foreground">On this page</div>
            <ul className="mt-2 space-y-0.5 border-l text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-zinc-600 transition-colors hover:border-navy hover:text-navy">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}

function Section({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Steps({ items }: { items: [string, string][] }) {
  return (
    <ol className="divide-y rounded-xl border bg-white">
      {items.map(([k, v], i) => (
        <li key={k} className="flex gap-3 px-4 py-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-zinc-600">{i + 1}</span>
          <div>
            <div className="font-medium text-foreground">{k}</div>
            <p className="text-sm leading-6 text-muted-foreground">{v}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-8 shrink-0 font-medium tabular text-foreground">{k}</dt>
      <dd className="text-muted-foreground">{v}</dd>
    </div>
  );
}

function Mini({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 font-semibold text-foreground"><Icon className="size-4 text-gold-ink" />{title}</div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function Tip({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-navy/10 bg-navy-soft/60 p-4">
      <Icon className="mt-1 size-4 shrink-0 text-navy" />
      <div className="text-sm leading-6">
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-zinc-700">{children}</div>
      </div>
    </div>
  );
}

function ExampleLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <LensLink href={href} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-sm font-medium text-navy transition-colors hover:border-navy">
      <Gauge className="size-3.5" /> {children} <ArrowRight className="size-3.5" />
    </LensLink>
  );
}

