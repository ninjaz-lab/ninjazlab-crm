import {neon} from "@neondatabase/serverless";
import {config} from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

await sql`
    CREATE TABLE IF NOT EXISTS "contact"
    (
        "id"
        text
        PRIMARY
        KEY,
        "user_id"
        text
        NOT
        NULL
        REFERENCES
        "user"
    (
        "id"
    ) ON DELETE CASCADE,
        "first_name" text,
        "last_name" text,
        "email" text,
        "phone" text,
        "address" text,
        "city" text,
        "state" text,
        "country" text,
        "postal_code" text,
        "notes" text,
        "custom_fields" jsonb DEFAULT '{}',
        "source" text NOT NULL DEFAULT 'manual',
        "created_at" timestamp NOT NULL DEFAULT now
    (
    ),
        "updated_at" timestamp NOT NULL DEFAULT now
    (
    )
        )
`;

await sql`
  CREATE TABLE IF NOT EXISTS "contact_list" (
    "id" text PRIMARY KEY,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "description" text,
    "color" text DEFAULT '#6366f1',
    "count" integer NOT NULL DEFAULT 0,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS "contact_list_member" (
    "id" text PRIMARY KEY,
    "list_id" text NOT NULL REFERENCES "contact_list"("id") ON DELETE CASCADE,
    "contact_id" text NOT NULL REFERENCES "contact"("id") ON DELETE CASCADE,
    "added_at" timestamp NOT NULL DEFAULT now()
  )
`;

console.log("✓ Contact tables created");
