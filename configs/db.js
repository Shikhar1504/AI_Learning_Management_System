import { drizzle } from "drizzle-orm/neon-http";

// Guard: fail fast on startup if DB env var is missing
if (!process.env.DATABASE_CONNECTION_STRING) {
  throw new Error("DATABASE_CONNECTION_STRING env var is not set");
}

export const db = drizzle(process.env.DATABASE_CONNECTION_STRING);
