// Print stored results for a startup (run: npx tsx scripts/inspect.ts <startupId>)
import { config } from "dotenv"; config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
(async () => {
  const id = process.argv[2] ?? "npharvest";
  const { data: a } = await db.from("assessments").select("framework,level,confidence,distribution,details,needs_review").eq("startup_id", id);
  for (const r of a ?? []) {
    const d = r.distribution ? Object.entries(r.distribution).filter(([, p]) => (p as number) >= 0.02).map(([k, p]) => `${k}:${(p as number).toFixed(2)}`).join(" ") : "";
    console.log(r.framework, "claude", r.level, "conf", r.confidence, "| jev", d, r.details?.jev_confidence ?? "", r.needs_review ? "REVIEW" : "");
  }
  const { data: m } = await db.from("matches").select("target_type,target_id,rank,status,calibrated_fit,rationale").eq("startup_id", id).eq("thesis_id", "redstone-blue").lte("rank", 3).order("target_type").order("rank");
  for (const r of m ?? []) console.log(`${r.target_type} #${r.rank} ${r.target_id} [${r.status}] cal=${r.calibrated_fit ?? "-"}\n   ${r.rationale}`);
  const { data: c } = await db.from("connections").select("kind,title").eq("startup_id", id);
  console.log(c?.map((x) => `[${x.kind}] ${x.title}`).join("\n"));
  const { data: s } = await db.from("actions").select("horizon,title").eq("startup_id", id).order("rank");
  console.log(s?.map((x) => `${x.horizon} ${x.title}`).join("\n"));
})();
