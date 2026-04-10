import {neonConfig, Pool} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-serverless";
import ws from "ws";

// This tells Neon to use the 'ws' package for WebSockets in Node.js
if (typeof window === "undefined") {
    neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({connectionString: process.env.DATABASE_URL});

// This instance now supports .transaction()
export const db = drizzle(pool);