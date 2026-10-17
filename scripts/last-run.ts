// Show the most recent pipeline run and its events (dev helper): npx tsx scripts/last-run.ts
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data: runs } = await db.from("pipeline_runs").select("*").order("started_at", { ascending: false }).limit(1);
  const run = runs?.[0];
  if (!run) return console.log("no runs");
  console.log(`run ${run.id} startup=${run.startup_id} status=${run.status} started=${run.started_at} finished=${run.finished_at} error=${run.error ?? "-"}`);
  const { data: ev } = await db.from("pipeline_events").select("*").eq("run_id", run.id).order("id");
  for (const e of ev ?? []) console.log(`${e.created_at.slice(11, 19)} ${e.status.padEnd(8)} ${(e.agent ?? e.step).padEnd(22)} ${String(e.message).slice(0, 110)}${e.payload ? `  payload=${JSON.stringify(e.payload).slice(0, 120)}` : ""}`);
}
main();
