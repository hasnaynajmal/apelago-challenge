import type { Quadrant } from "@/lib/quadrant";

export const QUADRANTS: Record<Quadrant, { label: string; hint: string; dot: string; badge: string; fill: string }> = {
  invest: {
    label: "Investment-ready",
    hint: "Fits the thesis and is mature enough for a round. Make investor intros.",
    dot: "#059669",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    fill: "#ecfdf5",
  },
  accelerate: {
    label: "Accelerate",
    hint: "Fits the thesis but is still early. Best candidates for an A'Pelago programme.",
    dot: "#002444",
    badge: "bg-navy-soft text-navy ring-blue-200",
    fill: "#f1f5f9",
  },
  refer: {
    label: "Refer onwards",
    hint: "Mature, but outside this thesis. Introduce to better-fitting investors.",
    dot: "#d97706",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    fill: "#fffbeb",
  },
  monitor: {
    label: "Monitor",
    hint: "Early and off-thesis. Revisit when there is new traction.",
    dot: "#a1a1aa",
    badge: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    fill: "#fafafa",
  },
};
