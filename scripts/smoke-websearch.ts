// Smoke test: Mastra agent using Claude's server-side web search tool (run: npx tsx scripts/smoke-websearch.ts)
import { config } from "dotenv";
config({ path: ".env.local" });

import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";

async function main() {
  const agent = new Agent({
    id: "smoke-scout",
    name: "Smoke Scout",
    instructions: "Research startups on the web. Answer in 3 short bullet points with source URLs.",
    model: anthropic("claude-sonnet-5-5"),
    tools: { web_search: anthropic.tools.webSearch_20260209({ maxUses: 3 }) },
  });
  const t = Date.now();
  const res = await agent.generate("What does the Finnish startup NPHarvest do, and what funding has it raised?");
  console.log(`(${Date.now() - t} ms)\n${res.text}`);
  console.log("sources:", (res.sources ?? []).length);
}
main().catch((e) => console.error("FAIL", e.message));
