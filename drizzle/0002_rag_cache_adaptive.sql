-- Migration: 0002_rag_cache_adaptive
-- Purpose : Enable pgvector + add RAG, semantic cache, and adaptive learning tables
-- Safe    : All statements are additive (no existing table altered destructively)
-- Run via : npx drizzle-kit push  OR  execute manually in your Neon SQL editor

-- ─────────────────────────────────────────────────────────────────
-- 1. Enable pgvector extension (idempotent)
-- ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────
-- 2. Add embedding column to topics table (nullable — backfilled
--    lazily as notes are generated; does not break existing rows)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "topics"
  ADD COLUMN IF NOT EXISTS "embedding" vector(768);

--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────
-- 3. RAG: Document chunks
--    Stores chunked course content with embeddings for retrieval
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "documentChunks" (
  "id"          varchar(256) PRIMARY KEY NOT NULL,
  "courseId"    varchar      NOT NULL,
  "sourceType"  varchar      NOT NULL,   -- 'notes' | 'outline' | 'upload'
  "chunkIndex"  integer      NOT NULL,
  "content"     text         NOT NULL,
  "embedding"   vector(768),
  "createdAt"   timestamp    DEFAULT now()
);

--> statement-breakpoint

-- Regular B-tree indexes for courseId filtering
CREATE INDEX IF NOT EXISTS "chunk_course_id_idx"   ON "documentChunks" ("courseId");
CREATE INDEX IF NOT EXISTS "chunk_source_type_idx" ON "documentChunks" ("sourceType");

-- HNSW index for fast approximate nearest-neighbour search (cosine distance)
-- m=16, ef_construction=64 are safe defaults for 768-dim vectors
CREATE INDEX IF NOT EXISTS "chunk_embedding_hnsw_idx"
  ON "documentChunks"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────
-- 4. Semantic cache
--    Stores query embeddings + cached AI responses
--    cacheService.js checks this BEFORE calling Gemini
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "semanticCache" (
  "id"               varchar(256) PRIMARY KEY NOT NULL,
  "queryText"        text         NOT NULL,
  "queryEmbedding"   vector(768),
  "response"         json         NOT NULL,
  "studyType"        varchar      NOT NULL,
  "hitCount"         integer      DEFAULT 0,
  "createdAt"        timestamp    DEFAULT now(),
  "lastAccessedAt"   timestamp    DEFAULT now()
);

--> statement-breakpoint

-- HNSW index on query embeddings — primary lookup path for cache checks
CREATE INDEX IF NOT EXISTS "cache_embedding_hnsw_idx"
  ON "semanticCache"
  USING hnsw ("queryEmbedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

--> statement-breakpoint

-- ─────────────────────────────────────────────────────────────────
-- 5. Adaptive learning: remedial content jobs
--    Created by quiz-attempt route when score < 60%
--    Processed by GenerateRemedialContent Inngest worker
-- ─────────────────────────────────────────────────────────────────
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
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "remedial_user_idx"    ON "remedialContent" ("userId");
CREATE INDEX IF NOT EXISTS "remedial_attempt_idx" ON "remedialContent" ("quizAttemptId");
