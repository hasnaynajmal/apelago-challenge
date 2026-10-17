// "Hidden connections": warm-intro paths, consortium suggestions, portfolio synergies, readiness unlocks, deadlines.
import { SECTORS, STAGES, type Sector, type Stage } from "../taxonomy";
import type { EntityType, Funding, Investor, Partner, Relationship, Startup } from "../types";
import { matchAll, stageFromReadiness, type MatchSet, type StartupSnapshot } from "./matching";

export interface Connection {
  kind: "warm_path" | "consortium" | "synergy" | "unlock" | "deadline";
  title: string;
  narrative: string;
  score: number;
  payload: Record<string, unknown>;
}

type NodeKey = `${EntityType}:${string}`;
interface Edge { to: NodeKey; label: string }

const REL_TEXT: Record<string, string> = {
  lp_of: "is an LP of",
  partner_of: "partners with",
  member_of: "is part of",
  co_funds: "co-funds",
  runs: "runs",
  cvc_of: "is the venture arm of",
  candidate_pilot: "could partner with",
};

const shortName = (name: string) => name.replace(/\s*\(.*\)\s*$/, "").replace(/ 2027 programmes$/, "");

interface Universe {
  investors: Investor[];
  funding: Funding[];
  partners: Partner[];
  startups: Startup[];
  relationships: Relationship[];
}

function nameOf(u: Universe, key: NodeKey): string {
  const [type, id] = key.split(":") as [EntityType, string];
  const list = { investor: u.investors, funding: u.funding, partner: u.partners, startup: u.startups }[type] as { id: string; name: string }[];
  return shortName(list.find((x) => x.id === id)?.name ?? id);
}

/** BFS over the relationship graph (+ virtual edges to top partner matches) to top investors. */
export function warmPaths(s: StartupSnapshot, m: MatchSet, u: Universe, maxDepth = 3): Connection[] {
  const adj = new Map<NodeKey, Edge[]>();
  const add = (a: NodeKey, b: NodeKey, label: string) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push({ to: b, label });
  };
  for (const r of u.relationships) {
    const a = `${r.from_type}:${r.from_id}` as NodeKey;
    const b = `${r.to_type}:${r.to_id}` as NodeKey;
    add(a, b, r.rel);
    add(b, a, `~${r.rel}`); // reverse traversal
  }
  const start = `startup:${s.id}` as NodeKey;
  for (const p of m.partners.slice(0, 8)) add(start, `partner:${p.target_id}`, "candidate_pilot");

  const targets = new Set(m.investors.slice(0, 12).map((i) => `investor:${i.target_id}` as NodeKey));
  const out: Connection[] = [];
  const queue: { node: NodeKey; path: { node: NodeKey; label: string }[] }[] = [{ node: start, path: [] }];
  const seen = new Set<NodeKey>([start]);
  while (queue.length) {
    const { node, path } = queue.shift()!;
    if (path.length >= maxDepth) continue;
    for (const e of adj.get(node) ?? []) {
      if (seen.has(e.to)) continue;
      const next = [...path, { node: e.to, label: e.label }];
      if (targets.has(e.to) && next.length >= 2) {
        const hops = [start, ...next.map((n) => n.node)];
        const sentence = next
          .map((n, i) => {
            const from = nameOf(u, hops[i]);
            const to = nameOf(u, n.node);
            const rev = n.label.startsWith("~");
            const rel = REL_TEXT[n.label.replace("~", "")] ?? n.label;
            return rev ? `${to} ${rel} ${from}` : `${from} ${rel} ${to}`;
          })
          .join(" → ");
        const inv = m.investors.find((i) => `investor:${i.target_id}` === e.to)!;
        out.push({
          kind: "warm_path",
          title: `Warm path to ${inv.name}`,
          narrative: sentence,
          score: inv.priority / next.length,
          payload: { investor_id: inv.target_id, hops: hops.map((h) => ({ key: h, name: nameOf(u, h) })), labels: next.map((n) => n.label) },
        });
        seen.add(e.to);
        continue;
      }
      seen.add(e.to);
      queue.push({ node: e.to, path: next });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 4);
}

/** For consortium-only calls, propose a research partner, an industrial partner and a cross-border startup. */
export function consortia(s: StartupSnapshot, m: MatchSet, u: Universe): Connection[] {
  const calls = m.funding.filter((f) => f.blockers.some((b) => b.startsWith("Consortium"))).slice(0, 2);
  const overlap = (sectors: string[]) => s.sectors.filter((x) => sectors.includes(x)).length;
  return calls.map((call) => {
    const research = u.partners
      .filter((p) => p.kind === "research")
      .sort((a, b) => overlap(b.sectors) - overlap(a.sectors) || Number(b.hq === s.country) - Number(a.hq === s.country))[0];
    const industry = m.partners.map((p) => u.partners.find((x) => x.id === p.target_id)!).find((p) => p && p.kind === "corporate");
    const peer = u.startups
      .filter((o) => o.id !== s.id && o.country && o.country !== s.country && overlap(o.sectors) > 0)
      .sort((a, b) => overlap(b.sectors) - overlap(a.sectors))[0];
    const members = [research?.name, industry?.name, peer?.name].filter(Boolean);
    return {
      kind: "consortium" as const,
      title: `Consortium for ${call.name}`,
      narrative: `Lead with ${s.name}; add ${members.join(", ")} to cover research, industrial pilot and cross-border requirements.`,
      score: call.priority,
      payload: { funding_id: call.target_id, research_id: research?.id, industry_id: industry?.id, peer_startup_id: peer?.id, deadline: call.deadline_date },
    };
  });
}

// Value-chain complementarity between sectors (who feeds whom).
const CHAIN: [Sector, Sector, string][] = [
  ["aquaculture_fisheries", "blue_biotech", "farmed biomass → marine ingredients"],
  ["aquaculture_fisheries", "water_management", "farm effluent → nutrient recovery"],
  ["blue_biotech", "circular_materials", "marine biomass → bio-based products"],
  ["water_management", "circular_materials", "recovered nutrients → circular products"],
  ["ocean_observation", "restoration_blue_carbon", "monitoring data → restoration MRV"],
  ["ocean_observation", "aquaculture_fisheries", "sensing → farm monitoring"],
  ["ocean_observation", "pollution_cleanup", "detection → cleanup"],
  ["shipping_ports", "climate_software", "vessel data → emissions accounting"],
  ["shipping_ports", "ocean_observation", "vessels → data platforms"],
  ["pollution_cleanup", "circular_materials", "collected waste → recycled materials"],
];

export function synergies(s: StartupSnapshot, u: Universe): Connection[] {
  const out: Connection[] = [];
  for (const o of u.startups) {
    if (o.id === s.id) continue;
    for (const [a, b, why] of CHAIN) {
      const fwd = s.sectors.includes(a) && o.sectors.includes(b);
      const rev = s.sectors.includes(b) && o.sectors.includes(a);
      if (fwd || rev) {
        out.push({
          kind: "synergy",
          title: `${s.name} × ${o.name}`,
          narrative: `Value-chain fit (${why}): ${o.name} — ${o.one_liner ?? ""}`,
          score: (o.apelago_alumnus ? 1.1 : 1) * (s.sectors[0] === a || s.sectors[0] === b ? 1 : 0.8),
          payload: { startup_id: o.id, link: why, sectors: [SECTORS[a], SECTORS[b]] },
        });
        break;
      }
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 3);
}

/** Which single readiness step unlocks the most opportunities (re-runs matching with +1 levels). */
export function unlocks(s: StartupSnapshot, base: MatchSet, data: Omit<Universe, "startups" | "relationships">): Connection[] {
  const readyKeys = (m: MatchSet) =>
    new Set([...m.investors, ...m.funding].filter((x) => x.status === "ready").map((x) => `${x.target_type}:${x.target_id}`));
  const before = readyKeys(base);
  const scenarios: { label: string; snap: StartupSnapshot; step: string }[] = [];
  const later = (stage: Stage, trl: number, brl: number): Stage => {
    const derived = stageFromReadiness(trl, brl);
    return STAGES.indexOf(derived) > STAGES.indexOf(stage) ? derived : stage;
  };
  if (s.trl < 9) scenarios.push({ label: `TRL ${s.trl} → ${s.trl + 1}`, step: s.trl < 6 ? "Run a pilot in a relevant environment" : "Field-trial the system in operations", snap: { ...s, trl: s.trl + 1, stage: later(s.stage, s.trl + 1, s.brl) } });
  if (s.brl < 9) scenarios.push({ label: `BRL ${s.brl} → ${s.brl + 1}`, step: s.brl < 6 ? "Convert a pilot into a paid test sale" : "Prove repeatable sales", snap: { ...s, brl: s.brl + 1, stage: later(s.stage, s.trl, s.brl + 1), irl: Math.min(9, s.irl + 1) } });
  if (s.oirl < 9) scenarios.push({ label: `OIRL ${s.oirl} → ${s.oirl + 1}`, step: s.oirl < 6 ? "Measure impact against a baseline" : "Get third-party impact verification", snap: { ...s, oirl: s.oirl + 1 } });

  return scenarios
    .map((sc) => {
      const after = matchAll(sc.snap, data);
      const gained = [...after.investors, ...after.funding].filter(
        (x) => x.status === "ready" && !before.has(`${x.target_type}:${x.target_id}`),
      );
      const euros = gained.reduce((t, g) => t + (g.amount_eur ?? 0), 0);
      return {
        kind: "unlock" as const,
        title: `${sc.label} unlocks ${gained.length} opportunit${gained.length === 1 ? "y" : "ies"}`,
        narrative: `${sc.step}. Newly ready: ${gained.slice(0, 4).map((g) => g.name).join(", ") || "none"}.`,
        score: gained.length + euros / 1_000_000,
        payload: { scenario: sc.label, step: sc.step, gained: gained.map((g) => ({ type: g.target_type, id: g.target_id, name: g.name })), euros },
      };
    })
    .filter((c) => (c.payload.gained as unknown[]).length > 0)
    .sort((a, b) => b.score - a.score);
}

export function deadlines(m: MatchSet, now = new Date(), horizonDays = 120): Connection[] {
  return m.funding
    .filter((f) => f.deadline_date)
    .map((f) => ({ f, days: Math.round((new Date(f.deadline_date!).getTime() - now.getTime()) / 86_400_000) }))
    .filter(({ days }) => days >= 0 && days <= horizonDays)
    .sort((a, b) => a.days - b.days)
    .map(({ f, days }) => ({
      kind: "deadline" as const,
      title: `${f.name} — ${days} days left`,
      narrative: `Deadline ${f.deadline_date}. ${f.blockers.length ? `To do first: ${f.blockers.join("; ")}.` : "Eligible now."}`,
      score: f.priority * (1 + (horizonDays - days) / horizonDays),
      payload: { funding_id: f.target_id, deadline: f.deadline_date, days },
    }));
}

export function findConnections(s: StartupSnapshot, m: MatchSet, u: Universe, now = new Date()): Connection[] {
  return [
    ...warmPaths(s, m, u),
    ...unlocks(s, m, u),
    ...consortia(s, m, u),
    ...synergies(s, u),
    ...deadlines(m, now),
  ];
}
