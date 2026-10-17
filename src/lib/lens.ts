// Thesis "lenses" the operator can view the radar through (ids match the `theses` table).
export const LENSES = [
  { id: "redstone-blue", label: "Redstone Blue", kind: "VC lens" },
  { id: "apelago-accelerator", label: "A'Pelago", kind: "Accelerator lens" },
  { id: "nordic-climate-generalist", label: "Custom", kind: "Nordic climate thesis" },
] as const;

export type LensId = (typeof LENSES)[number]["id"];
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
