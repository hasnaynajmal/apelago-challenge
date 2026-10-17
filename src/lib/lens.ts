// Thesis "lenses" the operator can view the radar through (ids match the `theses` table).
export const LENSES = [
  { id: "redstone-blue", label: "Redstone Blue VC", kind: "VC lens" },
  { id: "apelago-accelerator", label: "A'Pelago Accelerator", kind: "Accelerator lens" },
  { id: "nordic-climate-generalist", label: "Custom thesis", kind: "Nordic climate thesis" },
] as const;

export type LensId = (typeof LENSES)[number]["id"];

/**
 * How investors are framed for each lens. A VC lens owner never matches itself: other investors are
 * co-investors (same stage) or follow-on investors (later stage). An accelerator introduces ventures to investors.
 */
export const INVESTOR_FRAMING: Record<LensId, { ownerId: string | null; tab: string; sub: string; column: string; demand: string; demandSub: string }> = {
  "redstone-blue": {
    ownerId: "redstone-blue",
    tab: "Co-investors & follow-on",
    sub: "Funds Redstone could syndicate with on this round, or bring in for the next one.",
    column: "Best co-investor",
    demand: "Co-investors to activate",
    demandSub: "Funds most often matched as syndicate partners",
  },
  "apelago-accelerator": {
    ownerId: null,
    tab: "Investors to introduce",
    sub: "Investors A'Pelago could introduce the venture to.",
    column: "Best investor intro",
    demand: "Investors to activate",
    demandSub: "Most frequent top-3 match across the portfolio",
  },
  "nordic-climate-generalist": {
    ownerId: null,
    tab: "Investors",
    sub: "Investors that fit the venture now.",
    column: "Best investor match",
    demand: "Investors to activate",
    demandSub: "Most frequent top-3 match across the portfolio",
  },
};
export const DEFAULT_LENS: LensId = "redstone-blue";

export function resolveLens(value: string | string[] | undefined): LensId {
  const v = Array.isArray(value) ? value[0] : value;
  return (LENSES.find((l) => l.id === v)?.id ?? DEFAULT_LENS) as LensId;
}

export const PROGRAMMES: Record<string, string> = {
  lab2impact: "Lab2Impact",
  "helsinki-studio": "Helsinki Blue Economy Studio",
  noca: "NOCA · Nordic Ocean Accelerator",
  "northern-blue": "Northern Blue",
};
