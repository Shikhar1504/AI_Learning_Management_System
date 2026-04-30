/**
 * cacheService.js
 *
 * Semantic cache layer that sits in front of every Gemini AI call.
 * Uses pgvector cosine similarity PLUS keyword overlap to determine cache hits.
 *
 * Two-gate hit logic (BOTH must pass):
 *   Gate 1 — Embedding similarity >= SIMILARITY_THRESHOLD (0.88)
 *   Gate 2 — Keyword overlap ratio >= MIN_OVERLAP_RATIO (0.30)
 *             AND overlap count >= MIN_OVERLAP_COUNT (dynamic, min 2)
 *
 * WHY TWO GATES:
 *   Embedding similarity alone treats "Java basics" and "Java OOP" as near-identical
 *   because they share the same domain space. The keyword gate catches intent drift —
 *   if fewer than 30% of the current query's keywords appear in the cached query,
 *   it is a different topic even if the vector is close.
 *
 * Integration points:
 *   Called INSIDE existing Inngest step.run() blocks in functions.js
 *   Reads/writes SEMANTIC_CACHE_TABLE in the existing Neon PostgreSQL DB
 *
 * Flow:
 *   checkCache(query) → HIT  → return cached content (skip LLM)
 *                     → MISS → proceed to RAG + Gemini → storeCache(query, result)
 */

import { db } from "@/configs/db";
import { SEMANTIC_CACHE_TABLE } from "@/configs/schema";
import { sql } from "drizzle-orm";
import { generateEmbedding, formatVectorLiteral } from "./embeddingService";

// ─── Configuration ────────────────────────────────────────────────────────────
// Gate 1: embedding cosine similarity threshold.
// 0.88 catches paraphrased-but-equivalent queries (same topic, different wording).
const SIMILARITY_THRESHOLD = Number(
  process.env.RAG_SIMILARITY_THRESHOLD ?? 0.88,
);

// Near-hit band: logged for observability even when below threshold.
const NEAR_HIT_THRESHOLD = 0.8;

// Gate 2: minimum keyword overlap ratio to pass intent check.
// 0.30 = at least 30% of the current query's keywords must appear in the cached query.
// Below this, the queries are about different topics despite similar embedding vectors.
const MIN_OVERLAP_RATIO = Number(process.env.CACHE_MIN_OVERLAP_RATIO ?? 0.5);

// Absolute minimum overlap count (prevents spurious hits on very short queries).
// MIN_OVERLAP = max(2, floor(0.30 * keywordCount)) — evaluated dynamically per query.
const MIN_OVERLAP_FLOOR = 4;

// Maximum number of cache candidates to fetch from DB (safety cap).
const CACHE_LOOKUP_LIMIT = 1;

// ─── normalizeQuery ───────────────────────────────────────────────────────────
/**
 * Normalize a query string before embedding.
 * Must be applied consistently in both checkCache() and storeCache() so the
 * stored queryText is always in the same canonical form used for keyword matching.
 */
function normalizeQuery(text) {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

// ─── extractKeywords ──────────────────────────────────────────────────────────
/**
 * Extract meaningful keywords from a normalized query string.
 *
 * Strategy:
 *   - Strip all non-alphanumeric characters
 *   - Keep only words with length > 3 (removes "a", "the", "for", "java"→kept, etc.)
 *   - No hardcoded stop-word lists — works for any topic/domain dynamically
 *
 * Examples:
 *   "java basics oop flashcard"       → ["java", "basics", "flashcard"]
 *   "java multithreading concepts"    → ["java", "multithreading", "concepts"]
 *   "python data structures quiz"     → ["python", "data", "structures", "quiz"]
 *
 * @param {string} text - Already normalized (lowercase, trimmed) query string
 * @returns {string[]}
 */
function extractKeywords(text) {
  const GENERIC_WORDS = new Set([
    "basics",
    "concepts",
    "topic",
    "introduction",
    "overview",
    "fundamentals",
  ]);
  const IGNORE_WORDS = new Set([
    "flashcard",
    "flashcards",
    "quiz",
    "quizzes",
    "notes",
    "study",
    "generate",
    "questions",
    "answers",
  ]);
  return text
    .replace(/[^a-z0-9\s]/g, "") // strip punctuation, keep alphanumeric + spaces
    .split(" ")
    .filter(
      (word) =>
        word.length > 3 && !GENERIC_WORDS.has(word) && !IGNORE_WORDS.has(word),
    ); // drop short words (noise)
}

// ─── computeOverlap ───────────────────────────────────────────────────────────
/**
 * Compute keyword overlap between the current query and a cached query.
 *
 * Uses a Set for the cached keywords so lookup is O(1) per current keyword.
 *
 * @param {string[]} currentKw  - Keywords from the current query
 * @param {string[]} cachedKw   - Keywords from the cached queryText
 * @returns {{ count: number, ratio: number }}
 *   count  — number of matching keywords
 *   ratio  — count / currentKw.length (0.0–1.0)
 */
function computeOverlap(currentKw, cachedKw) {
  if (currentKw.length === 0) return { count: 0, ratio: 0 };
  const cachedSet = new Set(cachedKw);
  const count = currentKw.filter((k) => cachedSet.has(k)).length;
  const ratio = count / currentKw.length;
  return { count, ratio };
}

// ─── checkCache ───────────────────────────────────────────────────────────────
/**
 * Check the semantic cache for a result matching `queryText`.
 *
 * BOTH gates must pass for a HIT:
 *   Gate 1 — cosine similarity >= SIMILARITY_THRESHOLD
 *   Gate 2 — keyword overlap count >= max(MIN_OVERLAP_FLOOR, 30% of current keywords)
 *             AND overlap ratio >= MIN_OVERLAP_RATIO
 *
 * @param {string} queryText  - The prompt/query being checked
 * @param {string} studyType  - 'flashcard' | 'quiz' | 'notes' | 'remedial'
 * @returns {Promise<{ hit: boolean, content?: object, cacheId?: string }>}
 *
 * Never throws — on any error returns { hit: false } so the caller falls through
 * to normal generation. Cache is completely non-blocking.
 */
export async function checkCache(queryText, studyType) {
  try {
    const normalized = normalizeQuery(queryText);
    const embedding = await generateEmbedding(normalized);
    const vectorLiteral = formatVectorLiteral(embedding);

    // Fetch the best candidate AND its stored queryText for keyword comparison.
    // The queryText column is already normalized (stored that way in storeCache).
    const rows = await db.execute(sql`
      SELECT
        id,
        "queryText",
        response,
        1 - ("queryEmbedding" <=> ${vectorLiteral}::vector) AS similarity
      FROM "semanticCache"
      WHERE "studyType" = ${studyType}
      ORDER BY "queryEmbedding" <=> ${vectorLiteral}::vector
      LIMIT ${CACHE_LOOKUP_LIMIT}
    `);

    const best = rows.rows?.[0];
    const bestSim = best ? Number(best.similarity) : null;
    const nearHitCandidate =
      bestSim !== null &&
      bestSim >= NEAR_HIT_THRESHOLD &&
      bestSim < SIMILARITY_THRESHOLD &&
      best
        ? { content: best.response, cacheId: best.id }
        : null;

    // ── Gate 1: similarity check ───────────────────────────────────────────────
    if (bestSim === null || bestSim < SIMILARITY_THRESHOLD) {
      const label =
        bestSim !== null && bestSim >= NEAR_HIT_THRESHOLD
          ? "🟡 NEAR HIT"
          : "❌ MISS    ";
      console.log(
        `[CacheService] ${label}  similarity=${bestSim !== null ? bestSim.toFixed(4) : "none"} | threshold=${SIMILARITY_THRESHOLD} | type=${studyType}`,
      );
      return nearHitCandidate ? { hit: false, nearHit: nearHitCandidate } : { hit: false };
    }

    // ── Gate 2: keyword overlap / intent check ─────────────────────────────────
    const currentKw = extractKeywords(normalized);
    console.log(`[CacheService] keywords: [${currentKw.join(", ")}]`);
    const cachedKw = extractKeywords(String(best.queryText ?? ""));
    const { count: overlapCount, ratio: overlapRatio } = computeOverlap(
      currentKw,
      cachedKw,
    );

    // Adaptive minimum: 30% of current keywords, but never below MIN_OVERLAP_FLOOR
    const minRequired = Math.max(
      MIN_OVERLAP_FLOOR,
      Math.floor(MIN_OVERLAP_RATIO * currentKw.length),
    );

    const intentMismatch =
      overlapRatio < MIN_OVERLAP_RATIO || overlapCount < minRequired;

    if (intentMismatch) {
      // Vectors are close but keywords diverge — different topic, force MISS
      console.log(
        `[CacheService] similarity=${bestSim.toFixed(2)} overlap=${overlapCount} ratio=${overlapRatio.toFixed(2)} → MISS (intent mismatch)`,
      );
      return nearHitCandidate ? { hit: false, nearHit: nearHitCandidate } : { hit: false };
    }

    // ── Both gates passed → HIT ────────────────────────────────────────────────
    console.log(
      `[CacheService] ✅ HIT       similarity=${bestSim.toFixed(4)} | overlap=${overlapCount}/${currentKw.length} | ratio=${overlapRatio.toFixed(2)} | type=${studyType}`,
    );
    _updateCacheHit(best.id).catch(() => {}); // fire-and-forget, non-blocking
    return { hit: true, content: best.response, cacheId: best.id };
  } catch (error) {
    // Non-blocking: any error → MISS so caller falls through to normal generation
    console.warn(
      "[CacheService] Cache check failed, proceeding without cache:",
      error.message,
    );
    return { hit: false };
  }
}

// ─── storeCache ───────────────────────────────────────────────────────────────
/**
 * Store a new query + AI response in the semantic cache.
 *
 * The queryText stored in DB is already normalized so keyword matching in
 * checkCache() works correctly against the stored value.
 *
 * @param {string} queryText  - The original prompt
 * @param {object} content    - The parsed AI response object to cache
 * @param {string} studyType  - 'flashcard' | 'quiz' | 'notes' | 'remedial'
 * @returns {Promise<void>}
 *
 * Never throws — a storage failure is logged but does not affect the caller.
 */
export async function storeCache(queryText, content, studyType) {
  try {
    // Normalize before embedding — must match normalization in checkCache()
    const normalized = normalizeQuery(queryText);
    const embedding = await generateEmbedding(normalized);
    const vectorLiteral = formatVectorLiteral(embedding);

    await db.execute(sql`
      INSERT INTO "semanticCache" (
        "id", "queryText", "queryEmbedding", "response", "studyType",
        "hitCount", "createdAt", "lastAccessedAt"
      )
      VALUES (
        ${crypto.randomUUID()},
        ${normalized},
        ${vectorLiteral}::vector,
        ${JSON.stringify(content)}::json,
        ${studyType},
        0,
        now(),
        now()
      )
    `);

    console.log(
      `[CacheService] 💾 Stored  type=${studyType} | query="${normalized.slice(0, 60)}..."`,
    );
  } catch (error) {
    console.warn("[CacheService] Failed to store cache entry:", error.message);
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
async function _updateCacheHit(cacheId) {
  await db.execute(sql`
    UPDATE "semanticCache"
    SET
      "hitCount"        = "hitCount" + 1,
      "lastAccessedAt"  = now()
    WHERE id = ${cacheId}
  `);
}
