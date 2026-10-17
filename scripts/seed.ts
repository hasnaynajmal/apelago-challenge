// Seeds reference data from supabase/seed/*.json (run: npm run db:seed). Idempotent upserts.
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;
const read = (name: string): Row[] =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "supabase", "seed", `${name}.json`), "utf8"));

// Known hard deadlines (next relevant date) for funding calls; others stay text-only.
const DEADLINES: Record<string, string> = {
  "eic-accelerator": "2026-11-04",
  "sbep-jtc4": "2026-11-16",
  "sbep-regional-baltic": "2026-12-09",
  "mission-ocean-2027": "2027-09-21",
};

const range = (v: unknown): [number | null, number | null] =>
  Array.isArray(v) ? [v[0] ?? null, v[1] ?? null] : [null, null];

function mapInvestor(r: Row) {
  const [min, max] = range(r.ticket_eur);
  return {
    id: r.id, name: r.name, type: r.type, hq: r.hq,
    region_focus: r.region_focus ?? [], stages: r.stages ?? [], sectors: r.sectors ?? [],
    ticket_min_eur: min, ticket_max_eur: max, fund_size_eur_m: r.fund_size_eur_m ?? null,
    thesis: r.thesis, impact_required: !!r.impact_required, portfolio: r.portfolio ?? [],
    contacts: r.contacts ?? [], website: r.website ?? null, confidence: r.confidence,
    is_challenge_partner: !!r.is_challenge_partner, linked_funding: r.linked_funding ?? null,
  };
}

function mapFunding(r: Row) {
  const [amin, amax] = range(r.amount_eur);
  const [emin, emax] = range(r.equity_eur);
  const [tmin, tmax] = range(r.trl_range);
  return {
    id: r.id, name: r.name, provider: r.provider, kind: r.kind,
    geo_eligibility: r.geo_eligibility ?? [], applicant: r.applicant ?? [], stages: r.stages ?? [],
    amount_min_eur: amin, amount_max_eur: amax, equity_min_eur: emin, equity_max_eur: emax,
    cofunding_pct: r.cofunding_pct ?? null, trl_min: tmin, trl_max: tmax, sectors: r.sectors ?? [],
    deadline_text: r.deadline ?? null, deadline_date: DEADLINES[r.id as string] ?? null, rolling: !!r.rolling,
    description: r.description ?? null, url: r.url ?? null, requires: r.requires ?? null,
    notes: r.notes ?? null, confidence: r.confidence, is_challenge_partner: !!r.is_challenge_partner,
  };
}

function mapPartner(r: Row) {
  return {
    id: r.id, name: r.name, kind: r.kind, role: r.role ?? [], hq: r.hq, region: r.region ?? [],
    sectors: r.sectors ?? [], needs: r.needs, why_partner: r.why_partner, confidence: r.confidence,
  };
}

function mapStartup(r: Row) {
  return {
    id: r.id, name: r.name, website: r.website ?? null, country: r.country ?? null, city: r.city ?? null,
    founded: r.founded ?? null, one_liner: r.one_liner, sectors: r.sectors ?? [], stage: r.stage ?? null,
    known_funding_eur: r.known_funding_eur ?? null, source: r.source ?? null,
    apelago_alumnus: !!r.apelago_alumnus, demo_priority: r.demo_priority ?? null,
  };
}

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });

  const startups = read("startups");
  const alumniEdges = startups
    .filter((s) => s.apelago_alumnus)
    .map((s) => ({
      from_type: "startup", from_id: s.id, to_type: "funding", to_id: "apelago-programmes",
      rel: "member_of", note: `A'Pelago accelerator alumnus (${s.source})`, source: "apelago.fi",
    }));

  const jobs: [string, Row[], string][] = [
    ["theses", read("theses"), "id"],
    ["investors", read("investors").map(mapInvestor), "id"],
    ["funding", read("funding").map(mapFunding), "id"],
    ["partners", read("partners").map(mapPartner), "id"],
    ["startups", startups.map(mapStartup), "id"],
    ["relationships", [...read("relationships"), ...alumniEdges], "from_type,from_id,to_type,to_id,rel"],
  ];

  for (const [table, rows, onConflict] of jobs) {
    const { error } = await db.from(table).upsert(rows, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`seeded ${table.padEnd(14)} ${rows.length}`);
  }
}

main().catch((e) => {
  console.error("seed failed:", e.message);
  process.exit(1);
});
