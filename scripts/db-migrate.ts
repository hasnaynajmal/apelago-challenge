// Applies supabase/migrations/*.sql in order (run: npm run db:migrate). Tracks applied files in _migrations.
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

async function main() {
  const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query("create table if not exists _migrations (name text primary key, applied_at timestamptz default now())");
  await client.query("alter table _migrations enable row level security");
  const { rows } = await client.query<{ name: string }>("select name from _migrations");
  const applied = new Set(rows.map((r) => r.name));

  const dir = path.join(process.cwd(), "supabase", "migrations");
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (applied.has(file)) {
      console.log(`skip   ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into _migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`apply  ${file}`);
    } catch (e) {
      await client.query("rollback");
      throw e;
    }
  }
  await client.end();
}

main().catch((e) => {
  console.error("migration failed:", e.message);
  process.exit(1);
});
