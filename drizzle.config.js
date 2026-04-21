import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load environment variables from .env.local file
dotenv.config({ path: ".env.local" });

const connectionString =
  process.env.DATABASE_CONNECTION_STRING ||
  process.env.NEXT_PUBLIC_DATABASE_CONNECTION_STRING;

export default defineConfig({
  dialect: "postgresql",
  schema: "./configs/schema.js",
  dbCredentials: {
    url: connectionString,
  },
});
