import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

/**
 * Server-side Supabase client using the secret key (bypasses RLS). Used by agents, scripts and server components.
 * Never import from client components — SUPABASE_SECRET_KEY is not exposed to the browser.
 */
export function supabaseAdmin(): SupabaseClient {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
