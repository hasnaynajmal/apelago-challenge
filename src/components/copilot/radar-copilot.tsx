"use client";

// Atlas copilot: CopilotKit chat drawer for the dashboard. Shares the page context with the agent, renders the
// agent's tool calls as cards (agentic UI) and exposes frontend tools to navigate the app.
import { createContext, Suspense, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import {
  CopilotKit,
  CopilotModalHeader,
  CopilotSidebar,
  useAgentContext,
  useConfigureSuggestions,
  useFrontendTool,
  useRenderTool,
} from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { LENSES, resolveLens } from "@/lib/lens";
import { cn } from "@/lib/utils";
import { useLensTransition } from "@/components/dashboard/lens-transition";
import { Plus, X } from "lucide-react";
import { ThinkingSlot } from "./chat-parts";
import {
  CompareCard,
  ConnectionsCard,
  DeadlinesCard,
  InvestorsCard,
  OverviewCard,
  PlatformCard,
  ToolPending,
  VentureListCard,
  VentureSnapshotCard,
} from "./tool-cards";

const OpenContext = createContext<{ open: boolean; setOpen: (v: boolean) => void; newChat: () => void }>({
  open: false,
  setOpen: () => {},
  newChat: () => {},
});
export const useCopilotDrawer = () => useContext(OpenContext);
const noop = () => () => {};

export function RadarCopilot({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // Remounting the CopilotKit tree with a new key starts a fresh conversation.
  const [session, setSession] = useState(0);
  const newChat = () => setSession((n) => n + 1);
  // ⌘J / Ctrl+J toggles the drawer; Esc closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // CopilotKit generates ids during render, so it only mounts in the browser, next to (not around) the page.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return (
    <OpenContext.Provider value={{ open, setOpen, newChat }}>
      {children}
      {/* Click anywhere outside the drawer to close it. */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn("fixed inset-0 z-[1150] bg-zinc-900/15 transition-opacity duration-200", open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      {mounted && (
        <CopilotKit key={session} runtimeUrl="/api/copilotkit" enableInspector={false}>
          <Suspense>
            <CopilotBrain />
          </Suspense>
          <CopilotSidebar
          open={open}
          onOpenChange={setOpen}
          position="right"
          width={440}
          toggleButton={{ className: "hidden" }}
          header={DrawerHeaderSlot}
          // "Thinking…" shimmer instead of "Thought for N seconds".
          messageView={{ reasoningMessage: ThinkingSlot }}
          // Scroll once to the sent question, then let the answer stream below it without the view chasing every
          // chunk (the default pin-to-bottom re-scrolls on each token, which blurs the text).
          autoScroll="pin-to-send"
          labels={{
            modalHeaderTitle: "Ask Atlas",
            chatInputPlaceholder: "Ask Atlas anything…",
            welcomeMessageText: "Ask anything about the portfolio, or about the venture you are looking at.",
            chatDisclaimerText: "Answers come from Atlas data. Check key facts before acting.",
          }}
          />
        </CopilotKit>
      )}
    </OpenContext.Provider>
  );
}

function DrawerHeader() {
  const { setOpen, newChat } = useCopilotDrawer();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <span className="text-[15px] font-semibold">Ask Atlas</span>
      <button
        type="button"
        onClick={newChat}
        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        New chat
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close"
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </header>
  );
}

// The header slot expects CopilotModalHeader's shape (component + static parts).
const DrawerHeaderSlot = Object.assign(DrawerHeader, {
  displayName: "DrawerHeader",
  Title: CopilotModalHeader.Title,
  CloseButton: CopilotModalHeader.CloseButton,
  DrawerLauncher: CopilotModalHeader.DrawerLauncher,
});

const parse = <T,>(result: unknown): T | null => {
  if (result == null) return null;
  if (typeof result !== "string") return result as T;
  try {
    return JSON.parse(result) as T;
  } catch {
    return null;
  }
};

const anyArgs = z.object({}).passthrough();

// What each page shows, so "summarise this page" can be answered from the page itself without fetching data.
const PAGES: { prefix: string; name: string; shows: string; dataPage: boolean }[] = [
  { prefix: "/dashboard/guide", name: "Guide", dataPage: false, shows: "A plain-language guide to Atlas: the 5 questions it answers, a quick tour of every page, how to read a venture page, the four readiness levels (TRL, BRL, OIRL, IRL on 1–9: 1–3 early, 4–6 testing, 7–9 proven), how the score is weighted per thesis, the four groups, the Evaluate for switch, the Deep Panel's six steps with the Second Opinion check, hidden connections, example questions for Ask Atlas, data sources and limits, and a glossary." },
  { prefix: "/dashboard/startups", name: "Venture page", dataPage: true, shows: "One venture: header with score and breakdown, verdict, next move, best investor, next deadline, the four readiness cards, and tabs for Opportunities, Action plan, Connections and Deep dive." },
  { prefix: "/dashboard/ventures", name: "Ventures", dataPage: true, shows: "A table of every venture with score, readiness and group, filterable by group." },
  { prefix: "/dashboard/deadlines", name: "Deadlines", dataPage: true, shows: "Funding calls closing soon and the ventures that fit each call." },
  { prefix: "/dashboard/investors", name: "Investors / Co-investors", dataPage: true, shows: "Investors matched most often across the portfolio and the ventures they match." },
  { prefix: "/dashboard/assess", name: "Assess a startup", dataPage: false, shows: "A form to add a startup (name, website, country, one-liner) and run the Deep Panel, plus recent assessments." },
  { prefix: "/dashboard/runs", name: "Live assessment", dataPage: false, shows: "The Deep Panel assessing a venture live: progress, pipeline steps, readiness results and a live feed." },
  { prefix: "/dashboard", name: "Overview", dataPage: true, shows: "Where the pipeline stands (four groups), top 3 picks, this week's moves, upcoming deadlines and investors to activate." },
];

/** Context, suggestions, tool renderers and frontend tools. Lives inside the CopilotKit provider. */
function CopilotBrain() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const { switchLens } = useLensTransition();
  const lens = resolveLens(params.get("lens") ?? undefined);
  const lensLabel = LENSES.find((l) => l.id === lens)!.label;
  const ventureId = pathname.match(/^\/dashboard\/startups\/([^/]+)/)?.[1] ?? null;
  const current = PAGES.find((p) => pathname.startsWith(p.prefix));
  const onGuide = current?.name === "Guide";

  useAgentContext({
    description: "App context",
    value: {
      lens,
      evaluatingFor: lensLabel,
      page: pathname,
      currentPage: current ? { name: current.name, whatItShows: current.shows } : null,
      openVentureId: ventureId,
      note: ventureId ? `The user is on the venture page of "${ventureId}". "This startup" means this venture.` : "The user is not on a venture page.",
    },
  });

  useConfigureSuggestions(
    {
      available: "before-first-message",
      suggestions: onGuide
        ? [
            { title: "Summarise this guide", message: "Summarise this page in a few bullet points." },
            { title: "Where do I start?", message: "I'm new here. What should I look at first?" },
            { title: "Explain the score", message: "In simple words, how is the score calculated?" },
            { title: "What is a warm intro path?", message: "What is a warm intro path, in one or two sentences?" },
          ]
        : ventureId
        ? [
            { title: "Summarise this venture", message: "Give me a 3-line summary of this venture and whether we should act now." },
            { title: "Biggest gaps", message: "What are the biggest gaps holding this venture back, and how can it close them?" },
            { title: "Who to introduce first", message: "Which investor or partner should we introduce this venture to first, and why?" },
            { title: "Compare with peers", message: "Compare this venture with the two most similar ventures in the portfolio." },
          ]
        : [
            { title: "How does Atlas work?", message: "Explain what this platform does and how it works." },
            { title: "Top 5 for our thesis", message: "Which 5 ventures are most promising for our thesis right now?" },
            { title: "Investment-ready", message: "Which ventures are investment-ready, and what is the next step for each?" },
            { title: "Deadlines this month", message: "Which funding deadlines close in the next 30 days, and who should apply?" },
          ],
    },
    [ventureId, onGuide],
  );

  // ---- Agentic UI: backend tool calls rendered as cards ----
  useRenderTool(
    {
      name: "explainPlatform",
      parameters: anyArgs,
      render: ({ status, result }) => {
        const r = parse<Parameters<typeof PlatformCard>[0]["g"]>(result);
        return status !== "complete" || !r ? <ToolPending label="Opening the platform guide…" /> : <PlatformCard g={r} />;
      },
    },
    [],
  );
  useRenderTool(
    {
      name: "searchVentures",
      parameters: anyArgs,
      render: ({ status, result }) => {
        const r = parse<{ ventures: Parameters<typeof VentureListCard>[0]["ventures"]; total: number; lens: string }>(result);
        return status !== "complete" || !r ? <ToolPending label="Searching the portfolio…" /> : <VentureListCard title="Ventures" ventures={r.ventures} total={r.total} lens={r.lens} />;
      },
    },
    [],
  );
  useRenderTool(
    {
      name: "getVenture",
      parameters: anyArgs,
      render: ({ status, result }) => {
        const r = parse<Parameters<typeof VentureSnapshotCard>[0]["v"]>(result);
        return status !== "complete" || !r ? <ToolPending label="Reading the venture dossier…" /> : <VentureSnapshotCard v={r} />;
      },
    },
    [],
  );
  useRenderTool(
    {
      name: "compareVentures",
      parameters: anyArgs,
      render: ({ status, result }) => {
        const r = parse<{ ventures: Parameters<typeof CompareCard>[0]["ventures"]; lens: string }>(result);
        return status !== "complete" || !r ? <ToolPending label="Comparing ventures…" /> : <CompareCard ventures={r.ventures} lens={r.lens} />;
      },
    },
    [],
  );
  useRenderTool(
    {
      name: "findConnections",
      parameters: anyArgs,
      render: ({ status, result }) => {
        const r = parse<{ connections: Parameters<typeof ConnectionsCard>[0]["connections"]; total: number }>(result);
        return status !== "complete" || !r ? <ToolPending label="Tracing the relationship graph…" /> : <ConnectionsCard connections={r.connections} total={r.total} lens={lens} />;
      },
    },
    [lens],
  );
  useRenderTool(
    {
      name: "upcomingDeadlines",
      parameters: anyArgs,
      render: ({ status, result }) => {
        const r = parse<{ deadlines: Parameters<typeof DeadlinesCard>[0]["deadlines"]; lens: string }>(result);
        return status !== "complete" || !r ? <ToolPending label="Checking funding deadlines…" /> : <DeadlinesCard deadlines={r.deadlines} lens={r.lens} />;
      },
    },
    [],
  );
  useRenderTool(
    {
      name: "findInvestors",
      parameters: anyArgs,
      render: ({ status, result }) => {
        const r = parse<{ investors: Parameters<typeof InvestorsCard>[0]["investors"] }>(result);
        return status !== "complete" || !r ? <ToolPending label="Searching investors…" /> : <InvestorsCard investors={r.investors} />;
      },
    },
    [],
  );
  useRenderTool(
    {
      name: "portfolioOverview",
      parameters: anyArgs,
      render: ({ status, result }) => {
        const r = parse<Parameters<typeof OverviewCard>[0]["o"]>(result);
        return status !== "complete" || !r ? <ToolPending label="Summarising the portfolio…" /> : <OverviewCard o={r} />;
      },
    },
    [],
  );

  // ---- Frontend tools: the agent can drive the app ----
  useFrontendTool(
    {
      name: "openVenture",
      description: "Open a venture's page in the app. Use the venture id (e.g. 'kelluu').",
      parameters: z.object({ ventureId: z.string() }),
      handler: async ({ ventureId: id }) => {
        router.push(`/dashboard/startups/${id}?lens=${lens}`);
        return `Opened ${id}`;
      },
    },
    [lens, router],
  );
  useFrontendTool(
    {
      name: "switchLens",
      description: "Switch which thesis the app evaluates for: redstone-blue (VC), apelago-accelerator, or nordic-climate-generalist.",
      parameters: z.object({ lens: z.enum(["redstone-blue", "apelago-accelerator", "nordic-climate-generalist"]) }),
      handler: async ({ lens: next }) => {
        switchLens(next, pathname, params.toString()); // same dim → fade-in → toast as the sidebar switch
        return `Now evaluating for ${LENSES.find((l) => l.id === next)!.label}`;
      },
    },
    [pathname, params, switchLens],
  );

  return null;
}
