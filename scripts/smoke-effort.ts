// Verifies the model + effort settings reach the Anthropic API (one tiny call). Run: npx tsx scripts/smoke-effort.ts
import { config } from "dotenv";
config({ path: ".env.local" });

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.includes("api.anthropic.com") && typeof init?.body === "string") {
    const body = JSON.parse(init.body);
    console.log("request →", { model: body.model, output_config: body.output_config, thinking: body.thinking });
  }
  const res = await realFetch(input, init);
  return res;
};

async function main() {
  const { trlAssessor } = await import("../src/mastra/agents");
  const { levelAssessmentSchema } = await import("../src/mastra/schemas");
  const res = await trlAssessor.generate("Evidence: lab prototype tested in a water tank.", { structuredOutput: { schema: levelAssessmentSchema } });
  console.log("result →", res.object?.level, "| usage", res.usage);
}
main().catch((e) => console.error("FAIL", e.message));
