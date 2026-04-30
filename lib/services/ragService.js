/**
 * ragService.js
 *
 * Retrieval-Augmented Generation service.
 * Two responsibilities:
 *   1. INGESTION  — parse AI output → semantic text → embed → store in documentChunks
 *   2. RETRIEVAL  — embed query → cosine similarity search → context string for prompt
 *
 * Integration points:
 *   - ingestChunks() called AFTER study content is generated (in the Inngest worker)
 *   - retrieveContext() called BEFORE the Gemini prompt is built (in the Inngest worker)
 *
 * Chunking strategy (v3 — semantic + sentence-aware):
 *   - Parse JSON → convert each item to a full readable sentence (Q/A, quiz, etc.)
 *   - Group sentences into ≤500-char chunks without splitting mid-sentence
 *   - Add overlap by carrying the last sentence of the previous chunk forward
 *   - Fallback to character-window chunking for plain text / markdown notes
 */

import { db } from "@/configs/db";
import { DOCUMENT_CHUNK_TABLE, STUDY_MATERIAL_TABLE } from "@/configs/schema";
import { sql, eq, and } from "drizzle-orm";
import {
  generateEmbedding,
  batchGenerateEmbeddings,
  formatVectorLiteral,
} from "./embeddingService";

// ─── Configuration ────────────────────────────────────────────────────────────
const CHUNK_SIZE = 500; // max chars per chunk (character-window fallback)
const CHUNK_OVERLAP = 60; // overlap chars between consecutive fallback chunks

const DEFAULT_TOP_K = Number(process.env.RAG_TOP_K ?? 3); // reduced 5→3; lower-ranked chunks add noise

// Three-tier retrieval thresholds:
//   Same-course primary  — high-confidence match within current course
//   Same-course fallback — relaxed match within current course
//   Cross-course         — global search when same-course has NO results at all
// Read primary and fallback similarity thresholds from env when provided.
// Defaults chosen to match deployed `.env.local` recommendations.
const RAG_PRIMARY_SIMILARITY = Number(process.env.RAG_MIN_SIMILARITY ?? 0.6);
const RAG_FALLBACK_SIMILARITY = Number(
  process.env.RAG_FALLBACK_SIMILARITY ?? 0.55,
);
const RAG_CROSS_COURSE_SIMILARITY = Number(
  process.env.RAG_CROSS_COURSE_SIMILARITY ?? 0.65,
);

// Post-retrieval quality gate: chunks below this score are discarded even if
// they passed the SQL threshold. Prevents borderline results polluting the prompt.
// Removed: using SQL thresholds only for stability.

// Same-course results to fetch (increase candidate pool for retrieval)
const SAME_COURSE_LIMIT = 10;
// Cross-course results to fetch (reduced 5→3; precision over recall)
const CROSS_COURSE_LIMIT = 3;

// ─── normalizeRetrievalQuery ──────────────────────────────────────────────────
/**
 * Normalize a query string before embedding it for retrieval.
 * Strips generation-specific boilerplate words that add noise without semantic value.
 *
 * "Generate exactly 10 flashcards on topic: Python basics"
 *  → "flashcards topic python basics"
 *
 * @param {string} text
 * @returns {string}
 */
function normalizeRetrievalQuery(text) {
  // Words that are common in prompts but carry no retrieval meaning
  const NOISE_WORDS = new Set([
    "generate",
    "exactly",
    "create",
    "make",
    "please",
    "strictly",
    "in",
    "on",
    "for",
    "the",
    "a",
    "an",
    "with",
    "and",
    "or",
    "json",
    "format",
    "content",
    "list",
    "all",
    "result",
    "results",
    "number",
    "maximum",
    "minimum",
    "max",
    "min",
  ]);

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s:,]/g, " ") // strip punctuation except : and ,
    .replace(/\s+/g, " ") // collapse whitespace
    .split(" ")
    .filter((w) => w.length > 1 && !NOISE_WORDS.has(w))
    .join(" ");
}

// ─── extractKeywords ────────────────────────────────────────────────────────────
/**
 * Extract meaningful keywords from a text string.
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
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(" ")
    .filter((word) => word.length > 2 && !GENERIC_WORDS.has(word));
}

// ─── ingestChunks ─────────────────────────────────────────────────────────────
/**
 * Convert AI-generated content to semantic text chunks, embed, and store.
 *
 * Idempotent for (courseId, sourceType) — existing chunks are deleted before
 * re-inserting, so Inngest retries don't produce duplicates.
 *
 * @param {string} courseId    - Course this content belongs to
 * @param {string} sourceText  - AI response: JSON string or plain text
 * @param {string} sourceType  - 'flashcard' | 'quiz' | 'notes' | 'remedial' | etc.
 * @returns {Promise<number>}  - Number of chunks ingested (0 on failure)
 */
export async function ingestChunks(courseId, sourceText, sourceType) {
  if (!sourceText || sourceText.trim().length < 20) {
    console.log(
      `[RAGService] Skipping ingest — text too short for ${courseId}/${sourceType}`,
    );
    return 0;
  }

  const chunks = _buildChunks(sourceText, sourceType);
  if (chunks.length === 0) {
    console.log(
      `[RAGService] No chunks produced for ${courseId}/${sourceType}`,
    );
    return 0;
  }

  console.log(
    `[RAGService] Ingesting ${chunks.length} chunks | courseId=${courseId} | type=${sourceType}`,
  );

  try {
    const embeddings = await batchGenerateEmbeddings(chunks, 5);

    // Idempotent: clear previous chunks for this (course, sourceType)
    await db
      .delete(DOCUMENT_CHUNK_TABLE)
      .where(
        and(
          eq(DOCUMENT_CHUNK_TABLE.courseId, courseId),
          eq(DOCUMENT_CHUNK_TABLE.sourceType, sourceType),
        ),
      );

    for (let i = 0; i < chunks.length; i++) {
      const vectorLiteral = formatVectorLiteral(embeddings[i]);
      await db.execute(sql`
        INSERT INTO "documentChunks" (
          "id", "courseId", "sourceType", "chunkIndex", "content", "embedding", "createdAt"
        )
        VALUES (
          ${crypto.randomUUID()},
          ${courseId},
          ${sourceType},
          ${i},
          ${chunks[i]},
          ${vectorLiteral}::vector,
          now()
        )
      `);
    }

    const label =
      sourceType === "flashcard" || sourceType === "quiz"
        ? `(1 per ${sourceType})`
        : "";
    console.log(
      `[RAGService] ✅ Ingested ${chunks.length} chunks ${label} | courseId=${courseId}`,
    );
    return chunks.length;
  } catch (error) {
    // Non-fatal: generation already completed — skip RAG indexing, log and continue
    console.warn(
      `[RAGService] Chunk ingestion failed | courseId=${courseId} | ${error.message}`,
    );
    return 0;
  }
}

// ─── retrieveContext ──────────────────────────────────────────────────────────
/**
 * Retrieve semantically relevant chunks using hybrid same-course / cross-course logic.
 *
 * Retrieval priority:
 *   Step 1 — Same-course, similarity >= 0.75, limit 3  (high-confidence, fast)
 *   Step 2 — Same-course, similarity >= 0.70, limit 5  (relaxed, still course-scoped)
 *   Step 3 — Cross-course, similarity >= 0.65, limit 5 (global fallback — no courseId filter)
 *
 * Steps 1 & 2 run only when courseId is provided.
 * Step 3 runs only when steps 1+2 both return 0 results.
 * This lets a new "Java OOP" course reuse chunks from a prior "Java Basics" course.
 *
 * @param {string}  queryText  - Query/prompt to retrieve context for
 * @param {string}  [courseId] - Current course (used for same-course steps)
 * @param {number}  [topK]     - Max chunks (used by cross-course step)
 * @returns {Promise<string>}  - Formatted context string, or '' if nothing found
 *
 * Never throws — on failure returns '' so caller proceeds with the plain prompt.
 */
export async function retrieveContext(
  queryText,
  courseId = null,
  topK = DEFAULT_TOP_K,
) {
  try {
    console.log(`[RAGService] Query used: "${queryText}"`);
    console.log("[RAG DEBUG] courseId used:", courseId);

    const countResult = await db.execute(sql`
      SELECT COUNT(*) FROM "documentChunks"
      WHERE "courseId" = ${courseId}
    `);

    console.log("[RAG DEBUG] total chunks in DB:", countResult.rows[0].count);

    // Strip prompt boilerplate before embedding for cleaner retrieval
    const normalizedQuery = normalizeRetrievalQuery(queryText);
    console.log(
      `[RAGService] Query normalized: "${normalizedQuery.slice(0, 80)}"`,
    );
    console.log("[RAG DEBUG] query length:", normalizedQuery.length);
    console.log("[RAG DEBUG] query:", normalizedQuery);

    const embedding = await generateEmbedding(normalizedQuery);
    const vectorLiteral = formatVectorLiteral(embedding);

    let chunks = [];
    let retrievalSource = "";

    if (courseId) {
      // ── Step 1: Same-course, primary threshold ──────────────────────────────
      chunks = await _queryChunks(
        vectorLiteral,
        courseId,
        SAME_COURSE_LIMIT,
        RAG_PRIMARY_SIMILARITY,
      );

      if (chunks.length > 0) {
        retrievalSource = "same-course";
      } else {
        // ── Step 2: Same-course, relaxed threshold ────────────────────────────
        console.log(
          `[RAGService] Step 1 empty — retrying same-course at similarity>=${RAG_FALLBACK_SIMILARITY}`,
        );
        chunks = await _queryChunks(
          vectorLiteral,
          courseId,
          SAME_COURSE_LIMIT,
          RAG_FALLBACK_SIMILARITY,
        );
        if (chunks.length > 0) retrievalSource = "same-course (relaxed)";
      }
    }

    // ── Step 3: Cross-course global fallback ─────────────────────────────────
    // Debug: report DB results (candidates retrieved from pgvector)
    console.log("[RAG DEBUG] DB returned:", chunks.length);
    console.log(
      "[RAG DEBUG] similarities:",
      chunks.map((c) => c.similarity),
    );

    if (chunks.length === 0) {
      console.log(
        `[RAGService] No same-course results — falling back to cross-course retrieval (similarity>=${RAG_CROSS_COURSE_SIMILARITY})`,
      );
      chunks = await _queryChunks(
        vectorLiteral,
        null,
        CROSS_COURSE_LIMIT,
        RAG_CROSS_COURSE_SIMILARITY,
      );
      if (chunks.length > 0) retrievalSource = "cross-course fallback";
    }

    if (chunks.length === 0) {
      console.log(
        `[RAGService] ❌ No chunks found at any threshold | courseId=${courseId}`,
      );
      return "";
    }

    // Slice to topK, then optionally remove repeated topics when retrieval
    // returns more than 3 chunks. Preserve original ordering.
    let filtered = chunks.slice(0, topK);
    console.log(`[RAGService] chunksBeforeFilter=${filtered.length}`);

    if (chunks.length > 3) {
      const seenTopics = new Set();
      const deduped = [];

      for (const chunk of chunks) {
        const content = String(chunk?.content ?? "");
        const topicMatch = content.match(/^(?:Topic|Concept):\s*(.+)$/im);
        const topicKey = String(
          chunk?.topic ?? topicMatch?.[1] ?? content.split("\n")[0] ?? "",
        )
          .trim()
          .toLowerCase();

        if (!seenTopics.has(topicKey)) {
          deduped.push(chunk);
          seenTopics.add(topicKey);
        }
      }

      filtered = deduped.slice(0, 3);
    }

    console.log(`[RAGService] chunksAfterFilter=${filtered.length}`);

    // ── Logging: source + scores + previews ──────────────────────────────────
    const simScores = filtered
      .map((c) => Number(c.similarity).toFixed(2))
      .join(", ");
    console.log(
      `[RAGService] Retrieved ${filtered.length} chunks (${simScores})`,
    );
    filtered.forEach((c, i) => {
      const preview = c.content.slice(0, 50).replace(/\n/g, " ");
      console.log(
        `  [${i + 1}] sim=${Number(c.similarity).toFixed(4)} | "${preview}..."`,
      );
    });

    const contextParts = filtered
      .map((chunk, idx) => `[Chunk ${idx + 1}]\n${chunk.content}`)
      .join("\n\n");

    return `--- Relevant Course Context (${retrievalSource}) ---\n${contextParts}\n--- End of Context ---`;
  } catch (error) {
    console.warn(
      "[RAGService] Context retrieval failed, proceeding without RAG:",
      error.message,
    );
    return "";
  }
}

// ─── buildRAGPrompt ───────────────────────────────────────────────────────────
/**
 * Prepend retrieved context to an existing prompt.
 * The original prompt is preserved exactly — only the context block is prepended.
 */
export function buildRAGPrompt(originalPrompt, context) {
  if (!context || context.trim() === "") return originalPrompt;
  return `${context}\n\nUsing the context above as reference, ${originalPrompt}`;
}

// ─── buildRAGQuery ────────────────────────────────────────────────────────────
/**
 * Build a short semantic query string for RAG retrieval.
 *
 * Focuses on course title + study type + top topics.
 * Minimizes noise and maximizes cross-course retrieval consistency.
 *
 * @param {Object} options
 * @param {string} options.courseTitle - Course title (e.g. "Java OOP")
 * @param {string} options.studyType   - 'flashcard' | 'quiz' | 'notes' | 'remedial'
 * @param {Array} [options.chapters] - Chapters with titles and topics; structured RAG query building
 * @returns {string} - Compact, semantic-focused query string using chapter structure
 */
export function buildRAGQuery({ courseTitle, studyType, chapters = [] }) {
  const parts = [];

  if (courseTitle) parts.push(courseTitle);
  if (studyType) parts.push(studyType);

  const selectedChapters = Array.isArray(chapters) ? chapters.slice(0, 3) : [];

  for (const chapter of selectedChapters) {
    if (chapter?.title) {
      parts.push(chapter.title);
    }

    const topics = Array.isArray(chapter?.topics)
      ? chapter.topics.slice(0, 2)
      : [];
    parts.push(...topics);
  }

  return parts.join(" ").toLowerCase().replace(/\s+/g, " ").trim();
}

// ─── Internal: _queryChunks ───────────────────────────────────────────────────
/**
 * Execute a similarity-filtered pgvector query against documentChunks.
 *
 * @param {string}      vectorLiteral  - Formatted vector '[0.1,0.2,...]'
 * @param {string|null} courseId       - Optional course filter
 * @param {number}      topK
 * @param {number}      minSimilarity  - Minimum cosine similarity to include
 * @returns {Promise<Array<{content: string, similarity: number}>>}
 */
async function _queryChunks(vectorLiteral, courseId, topK, minSimilarity) {
  let rows;
  if (courseId) {
    rows = await db.execute(sql`
      SELECT
        content,
        1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "documentChunks"
      WHERE "courseId" = ${courseId}
        AND 1 - (embedding <=> ${vectorLiteral}::vector) >= ${minSimilarity}
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${topK}
    `);
  } else {
    rows = await db.execute(sql`
      SELECT
        content,
        1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "documentChunks"
      WHERE 1=1
        AND 1 - (embedding <=> ${vectorLiteral}::vector) >= ${minSimilarity}
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${topK}
    `);
  }

  console.log("==== RAW DB RESULTS ====");

  rows.rows.forEach((row, index) => {
    console.log(
      `[${index}] sim=${row.similarity.toFixed(4)} | ${row.content.slice(0, 60)}`,
    );
  });

  console.log("==== END RAW RESULTS ====");

  return rows.rows ?? [];
}

// ─── Internal: _buildChunks ───────────────────────────────────────────────────
/**
 * Convert AI-generated content into an array of meaningful, embeddable strings.
 *
 * Strategy:
 *   1. Try to parse sourceText as JSON
 *   2. If valid JSON → convert each item to a readable sentence → group into chunks
 *   3. If not JSON (notes, markdown) → sentence-aware character-window chunking
 *
 * @param {string} sourceText
 * @param {string} sourceType
 * @returns {string[]}
 */
function _buildChunks(sourceText, sourceType) {
  try {
    const parsed = JSON.parse(sourceText);
    const sentences = _extractSentences(parsed, sourceType);
    if (sentences.length > 0) {
      // 1 Concept = 1 Chunk. DO NOT merge multiple questions.
      // Sentences are naturally ~100-200 chars, perfect for precise retrieval.
      return sentences;
    }
  } catch (_) {
    // Not JSON — fall through to text chunking
  }

  return _chunkTextSentenceAware(sourceText, CHUNK_SIZE, CHUNK_OVERLAP);
}

// ─── Internal: _extractSentences ─────────────────────────────────────────────
/**
 * Convert each item of a structured AI response into a full, self-contained sentence.
 * These sentences are semantically rich and embed well.
 *
 * Flashcard:
 *   "Question: What is a Widget? Answer: A Widget is the basic building block of Flutter UI."
 *
 * Quiz:
 *   "Question: What is the fundamental building block of Flutter? Options: A) Widget B) Layout C) View D) Component. Correct Answer: Widget."
 *
 * Remedial:
 *   "Topic: Loops. Explanation: Loops repeat a block of code. Key points: for loop iterates; while loop runs until false."
 *
 * @param {object|Array} parsed
 * @param {string}       type
 * @returns {string[]}  - array of sentences, one per item
 */
function _extractSentences(parsed, type) {
  const normalizedType = (type || "").toLowerCase();

  // ── Flashcards: [{front, back, topic}, ...] ───────────────────────────────
  if (normalizedType === "flashcard") {
    const cards = Array.isArray(parsed) ? parsed : (parsed?.flashcards ?? []);
    return cards
      .filter((c) => c?.front && c?.back)
      .map((c) => {
        const topic = c.topic || "General";
        return `Topic: ${topic}\nQuestion: ${c.front.trim()}\nAnswer: ${c.back.trim()}`;
      });
  }

  // ── Quiz: {questions: [{question, options, answer, topic}, ...]} ──────────
  if (normalizedType === "quiz") {
    const questions = Array.isArray(parsed)
      ? parsed
      : (parsed?.questions ?? []);
    const validQuestions = questions.filter(
      (q) => q?.question && (q?.answer || q?.correctAnswer),
    );

    console.log(
      `[RAGService] Quiz parsing → ${validQuestions.length} valid questions`,
    );

    return validQuestions.map((q) => {
      const LETTERS = ["A", "B", "C", "D"];
      const opts = Array.isArray(q.options)
        ? q.options.map((o, i) => `${LETTERS[i] ?? i + 1}) ${o}`).join(" ")
        : "";

      const answer = (q.answer ?? q.correctAnswer).trim();
      const topic = q.topic || "General";

      return `Topic: ${topic}\nQuestion: ${q.question.trim()}\nAnswer: ${answer}\nOptions: ${opts}`;
    });
  }

  // ── Remedial: {studyPlan: [{topic, explanation, keyPoints, ...}]} ──────────
  if (normalizedType === "remedial") {
    const plan = Array.isArray(parsed) ? parsed : (parsed?.studyPlan ?? []);
    return plan
      .filter((p) => p?.topic)
      .map((p) => {
        const kp = Array.isArray(p.keyPoints) ? p.keyPoints.join("; ") : "";
        const conceptStr = p.topic || "General";
        return [
          `Concept: ${conceptStr}\nTopic: ${p.topic.trim()}`,
          p.explanation ? `Explanation: ${p.explanation.trim()}` : "",
          kp ? `Key points: ${kp}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      });
  }

  return []; // No structured extractor — caller falls back to text chunking
}

// ─── Internal: _groupSentencesIntoChunks ──────────────────────────────────────
/**
 * Group an array of sentences into chunks of up to `maxChars` characters.
 * Never splits a sentence across two chunks.
 * Overlap: the last sentence of the previous chunk is prepended to the next.
 *
 * @param {string[]} sentences
 * @param {number}   maxChars
 * @param {number}   _overlap   - unused for sentence chunks; sentences provide natural overlap
 * @returns {string[]}
 */
function _groupSentencesIntoChunks(sentences, maxChars) {
  const chunks = [];
  let current = [];
  let currentLen = 0;
  let overlapSentence = "";

  for (const sentence of sentences) {
    const addLen = sentence.length + (current.length > 0 ? 1 : 0); // +1 for space

    if (currentLen + addLen > maxChars && current.length > 0) {
      // Flush current chunk
      chunks.push(current.join(" "));
      // Carry the last sentence forward as overlap
      overlapSentence = current[current.length - 1] ?? "";
      current = overlapSentence ? [overlapSentence, sentence] : [sentence];
      currentLen = current.reduce((a, s) => a + s.length + 1, 0);
    } else {
      current.push(sentence);
      currentLen += addLen;
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(" "));
  }

  return chunks;
}

// ─── Internal: _chunkTextSentenceAware ────────────────────────────────────────
/**
 * Sentence-aware character-window chunker for plain text / markdown.
 * Splits text into sentences first, then groups them into chunks without
 * splitting mid-sentence. Falls back to hard character slicing only when a
 * single sentence exceeds maxChars (rare).
 *
 * @param {string} text
 * @param {number} maxChars
 * @param {number} overlap  - not used directly; last sentence provides natural overlap
 * @returns {string[]}
 */
function _chunkTextSentenceAware(text, maxChars) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return [clean];

  // Split into sentences on ". ", "? ", "! ", "\n"
  const sentenceRegex = /(?<=[.?!])\s+|(?<=\n)/;
  const rawSentences = clean
    .split(sentenceRegex)
    .map((s) => s.trim())
    .filter(Boolean);

  return _groupSentencesIntoChunks(rawSentences, maxChars);
}
