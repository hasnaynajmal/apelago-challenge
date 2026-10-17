// POST /api/assess — start a live assessment run.
// Body: { startupId } for an existing startup, or { name, website?, oneLiner?, country? } to add a new one.
// Returns { runId, startupId } immediately; progress streams via Supabase Realtime on pipeline_events.
import { after } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createRun, runPipeline } from "@/lib/pipeline/run";

export const maxDuration = 300;

const body = z.union([
  z.object({ startupId: z.string().min(1), research: z.boolean().optional() }),
  z.object({
    name: z.string().min(2),
    website: z.string().url().optional(),
    oneLiner: z.string().optional(),
    country: z.string().length(2).optional(),
  }),
]);

const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  const db = supabaseAdmin();
  const input = parsed.data;

  let startupId: string;
  let research = false;
  if ("startupId" in input) {
    startupId = input.startupId;
    research = input.research ?? false;
    const { data } = await db.from("startups").select("id").eq("id", startupId).maybeSingle();
    if (!data) return Response.json({ error: `Unknown startup ${startupId}` }, { status: 404 });
  } else {
    startupId = slug(input.name);
    research = true;
    const { error } = await db.from("startups").upsert(
      {
        id: startupId, name: input.name, website: input.website ?? null, one_liner: input.oneLiner ?? null,
        country: input.country?.toUpperCase() ?? null, source: "Live intake",
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  const runId = await createRun(startupId);
  after(async () => {
    try {
      await runPipeline(startupId, { runId, research });
    } catch (e) {
      console.error(`[assess] ${startupId}: ${(e as Error).message}`);
    }
  });
  return Response.json({ runId, startupId });
}
