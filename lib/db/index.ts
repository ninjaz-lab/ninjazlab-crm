import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {prepare: false});

// This instance fully supports .transaction() and standard queries
export const db = drizzle(client);