import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// For Supabase connection pooler (Transaction mode on port 6543)
// Disable prepare for transaction pooler compatibility
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  ssl: "require",
});

export const db = drizzle(client, { schema });

