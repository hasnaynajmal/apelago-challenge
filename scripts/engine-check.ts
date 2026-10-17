// Sanity check for the deterministic engine with hand-set readiness levels (run: npx tsx scripts/engine-check.ts [startupId])
import { config } from "dotenv";
config({ path: ".env.local" });

import { loadUniverse } from "../src/lib/data";
import { matchAll, stageFromReadiness, type StartupSnapshot } from "../src/lib/engine/matching";
import { findConnections } from "../src/lib/engine/connections";
import { programmeFit, promiseScore, thesisFit } from "../src/lib/engine/scoring";

async function main() {
  const u = await loadUniverse();
  const st = u.startups.find((x) => x.id === (process.argv[2] ?? "npharvest"))!;
  const snap: StartupSnapshot = {
    id: st.id, name: st.name, country: st.country, sectors: st.sectors,
    trl: 7, brl: 5, oirl: 5, irl: 5, stage: stageFromReadiness(7, 5), raiseEur: null,
  };
  const m = matchAll(snap, u);
  const show = (label: string, xs: typeof m.investors) => {
    console.log(`\n== ${label} (${xs.length})`);
    for (const x of xs.slice(0, 5))
      console.log(`  ${x.priority.toFixed(2)} ${x.status.padEnd(15)} ${x.name}\n      + ${x.reasons.join(" | ")}${x.blockers.length ? `\n      - ${x.blockers.join(" | ")}` : ""}`);
  };
  show("Investors", m.investors);
  show("Funding", m.funding);
  show("Partners", m.partners);
  console.log("\n== Connections");
  for (const c of findConnections(snap, m, u)) console.log(`  [${c.kind}] ${c.title}\n      ${c.narrative}`);
  console.log("\n== Thesis scores");
  for (const t of u.theses) {
    const fit = thesisFit(snap, t.config);
    const p = promiseScore(snap, fit, { coupling: 0.8, knownFundingEur: st.known_funding_eur, alumnus: st.apelago_alumnus, teamDim: 4 }, t.config.promise_weights);
    console.log(`  ${t.id.padEnd(26)} promise ${p.promise}  fit ${fit.score.toFixed(2)}  ${fit.notes.join("; ")}`);
  }
  console.log("  programme:", programmeFit(snap, st.city));
}
main();
