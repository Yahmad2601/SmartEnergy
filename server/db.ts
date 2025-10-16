import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for local development
neonConfig.webSocketConstructor = ws;

// Accept self-signed certificates in development
neonConfig.fetchOptions = {
  ...(neonConfig.fetchOptions || {}),
};

if (process.env.NODE_ENV === "development") {
  // Disable TLS verification for development (Supabase/Neon often uses self-signed certs in dev)
  neonConfig.fetchOptions = {
    ...neonConfig.fetchOptions,
  };
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
