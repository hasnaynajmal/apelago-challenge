// Smoke test: Mastra agent + Claude structured output (run: npx tsx scripts/smoke-mastra.ts)
import { config } from "dotenv";
config({ path: ".env.local" });

import { Agent } from "@mastra/core/agent";
import { z } from "zod";

const schema = z.object({
  trl: z.number().int().min(1).max(9),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});

const agent = new Agent({
  id: "smoke-assessor",
  name: "Smoke Assessor",
  instructions: "You assess Technology Readiness Level (TRL 1-9, EU scale) from evidence. Be concise.",
  model: process.env.RADAR_MODEL ?? "anthropic/claude-sonnet-5-5",
});

const prompt =
  "Evidence: the startup ran a 6-month pilot of its nutrient-recovery unit at a municipal wastewater plant and signed its first paying customer.";

async function attempt(label: string, opts: Record<string, unknown>) {
  const t = Date.now();
  try {
    const res = await agent.generate(prompt, { structuredOutput: { schema, ...opts } });
    console.log(`PASS ${label} (${Date.now() - t} ms)`, res.object);
    return true;
  } catch (e) {
    console.log(`FAIL ${label}:`, (e as Error).message.slice(0, 300));
    return false;
  }
}

async function main() {
  const native = await attempt("native structured output", {});
  if (!native) await attempt("jsonPromptInjection fallback", { jsonPromptInjection: true });
}
main();
