import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS "contact_import_job" (
    "id" text PRIMARY KEY,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "status" text NOT NULL DEFAULT 'queued',
    "file_name" text NOT NULL DEFAULT 'import',
    "total_rows" integer NOT NULL DEFAULT 0,
    "processed_rows" integer NOT NULL DEFAULT 0,
    "new_count" integer NOT NULL DEFAULT 0,
    "updated_count" integer NOT NULL DEFAULT 0,
    "skipped_count" integer NOT NULL DEFAULT 0,
    "rows" jsonb NOT NULL DEFAULT '[]',
    "mapping" jsonb NOT NULL DEFAULT '{}',
    "merge_key" text NOT NULL DEFAULT 'email',
    "merge_strategy" text NOT NULL DEFAULT 'fill',
    "add_to_list_id" text,
    "error" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
  )
`;

console.log("✓ contact_import_job table created");
