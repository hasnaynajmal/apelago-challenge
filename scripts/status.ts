// Show assessment coverage per startup (run: npx tsx scripts/status.ts)
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const [{ data: s }, { data: sc }, { data: a }, { data: runs }] = await Promise.all([
    db.from("startups").select("id,profile"),
    db.from("scores").select("startup_id,thesis_id,promise,updated_at"),
    db.from("assessments").select("startup_id,framework"),
    db.from("pipeline_runs").select("startup_id,status").order("started_at", { ascending: false }),
  ]);
  for (const x of s ?? []) {
    const scores = (sc ?? []).filter((r) => r.startup_id === x.id);
    const fw = (a ?? []).filter((r) => r.startup_id === x.id).map((r) => r.framework).join(",");
    const last = runs?.find((r) => r.startup_id === x.id)?.status ?? "-";
    console.log(`${x.id.padEnd(18)} profile:${x.profile ? "Y" : "-"} scores:${scores.length} [${fw}] lastRun:${last} promise:${scores.find((r) => r.thesis_id === "redstone-blue")?.promise ?? "-"}`);
  }
}
main();
