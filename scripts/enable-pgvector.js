// One-time bootstrap: enable pgvector extension in Neon before drizzle-kit push
// Run: node scripts/enable-pgvector.js

const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_CONNECTION_STRING);

  console.log("Enabling pgvector extension...");
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("✅ pgvector extension enabled");

  console.log("Creating documentChunks table...");
  await sql`
    CREATE TABLE IF NOT EXISTS "documentChunks" (
      "id"          varchar(256) PRIMARY KEY NOT NULL,
      "courseId"    varchar      NOT NULL,
      "sourceType"  varchar      NOT NULL,
      "chunkIndex"  integer      NOT NULL,
      "content"     text         NOT NULL,
      "embedding"   vector(768),
      "createdAt"   timestamp    DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "chunk_course_id_idx"   ON "documentChunks" ("courseId")`;
  await sql`CREATE INDEX IF NOT EXISTS "chunk_source_type_idx" ON "documentChunks" ("sourceType")`;
  await sql`
    CREATE INDEX IF NOT EXISTS "chunk_embedding_hnsw_idx"
      ON "documentChunks"
      USING hnsw ("embedding" vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
  `;
  console.log("✅ documentChunks table created");

  console.log("Creating semanticCache table...");
  await sql`
    CREATE TABLE IF NOT EXISTS "semanticCache" (
      "id"               varchar(256) PRIMARY KEY NOT NULL,
      "queryText"        text         NOT NULL,
      "queryEmbedding"   vector(768),
      "response"         json         NOT NULL,
      "studyType"        varchar      NOT NULL,
      "hitCount"         integer      DEFAULT 0,
      "createdAt"        timestamp    DEFAULT now(),
      "lastAccessedAt"   timestamp    DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS "cache_embedding_hnsw_idx"
      ON "semanticCache"
      USING hnsw ("queryEmbedding" vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
  `;
  console.log("✅ semanticCache table created");

  console.log("Creating remedialContent table...");
  await sql`
    CREATE TABLE IF NOT EXISTS "remedialContent" (
      "id"              varchar(256) PRIMARY KEY NOT NULL,
      "userId"          varchar      NOT NULL,
      "courseId"        varchar,
      "quizAttemptId"   varchar      NOT NULL,
      "percentage"      integer      NOT NULL,
      "weakTopics"      json,
      "status"          varchar      DEFAULT 'pending',
      "error"           text,
      "retryCount"      integer      DEFAULT 0,
      "createdAt"       timestamp    DEFAULT now(),
      "updatedAt"       timestamp    DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "remedial_user_idx"    ON "remedialContent" ("userId")`;
  await sql`CREATE INDEX IF NOT EXISTS "remedial_attempt_idx" ON "remedialContent" ("quizAttemptId")`;
  console.log("✅ remedialContent table created");

  console.log("Adding embedding column to topics table...");
  await sql`ALTER TABLE "topics" ADD COLUMN IF NOT EXISTS "embedding" vector(768)`;
  console.log("✅ topics.embedding column added");

  console.log("\n🎉 All migrations complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
