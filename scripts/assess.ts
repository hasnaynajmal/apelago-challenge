// Run the assessment pipeline from the CLI.
//   npm run assess -- npharvest            one startup (web research only if no stored profile)
//   npm run assess -- npharvest --research force fresh web research
//   npm run assess -- --all                all startups, 3 at a time
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { runPipeline } = await import("../src/lib/pipeline/run");
  const { supabaseAdmin } = await import("../src/lib/supabase/admin");
  const args = process.argv.slice(2);
  const research = args.includes("--research");
  let ids = args.filter((a) => !a.startsWith("--"));
  if (args.includes("--all")) {
    const { data } = await supabaseAdmin().from("startups").select("id").order("id");
    ids = (data ?? []).map((r) => r.id as string);
  }
  if (!ids.length) throw new Error("Pass a startup id or --all");

  const queue = [...ids];
  const failures: string[] = [];
  const worker = async () => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      const t = Date.now();
      try {
        await runPipeline(id, {
          research,
          onEvent: (e) => console.log(`[${id}] ${e.status.padEnd(8)} ${(e.agent ?? e.step).padEnd(22)} ${e.message}`),
        });
        console.log(`[${id}] ✔ ${((Date.now() - t) / 1000).toFixed(0)} s`);
      } catch (e) {
        failures.push(id);
        console.error(`[${id}] ✖ ${(e as Error).message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, ids.length) }, worker));
  if (failures.length) console.log(`Failed: ${failures.join(", ")}`);
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
