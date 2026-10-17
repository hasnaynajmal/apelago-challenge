// Portfolio quadrants (shared by server queries and client charts).
export type Quadrant = "invest" | "accelerate" | "refer" | "monitor";
export const READY_AT = 4.5; // mean of TRL, BRL, IRL (1–9)
export const FIT_AT = 0.75; // thesis fit (0–1)

export function quadrantOf(readiness: number, fit: number): Quadrant {
  if (fit >= FIT_AT) return readiness >= READY_AT ? "invest" : "accelerate";
  return readiness >= READY_AT ? "refer" : "monitor";
}
