// Loads reference data from Supabase (server-side only).
import { supabaseAdmin } from "./supabase/admin";
import type { Funding, Investor, Partner, Relationship, Startup, Thesis } from "./types";

export interface Universe {
  theses: Thesis[];
  startups: Startup[];
  investors: Investor[];
  funding: Funding[];
  partners: Partner[];
  relationships: Relationship[];
}

async function all<T>(table: string): Promise<T[]> {
  const { data, error } = await supabaseAdmin().from(table).select("*");
  if (error) throw new Error(`${table}: ${error.message}`);
  return data as T[];
}

export async function loadUniverse(): Promise<Universe> {
  const [theses, startups, investors, funding, partners, relationships] = await Promise.all([
    all<Thesis>("theses"),
    all<Startup>("startups"),
    all<Investor>("investors"),
    all<Funding>("funding"),
    all<Partner>("partners"),
    all<Relationship>("relationships"),
  ]);
  return { theses, startups, investors, funding, partners, relationships };
}
