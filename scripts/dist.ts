// Print score distributions per lens (dev helper): npx tsx scripts/dist.ts
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data: sc } = await db.from("scores").select("startup_id,thesis_id,promise,thesis_fit,breakdown");
  const { data: a } = await db.from("assessments").select("startup_id,framework,level");
  const lv = (id: string, f: string) => a?.find((x) => x.startup_id === id && x.framework === f)?.level ?? 0;
  for (const t of ["redstone-blue", "apelago-accelerator", "nordic-climate-generalist"]) {
    console.log(`== ${t}`);
    for (const s of (sc ?? []).filter((x) => x.thesis_id === t).sort((x, y) => y.promise - x.promise))
      console.log(`${s.startup_id.padEnd(16)} promise ${String(s.promise).padEnd(5)} fit ${s.thesis_fit.toFixed(2)} irl ${lv(s.startup_id, "irl")} trl ${lv(s.startup_id, "trl")} brl ${lv(s.startup_id, "brl")} oirl ${lv(s.startup_id, "oirl")} parts ${JSON.stringify(s.breakdown.fit_parts)}`);
  }
}
main();
