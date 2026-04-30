/**
 * embeddingService.js
 *
 * Single responsibility: generate text embeddings via the Gemini REST API.
 *
 * WHY FETCH INSTEAD OF THE SDK:
 *   @google/generative-ai v0.x routes embedContent() through its own hardcoded
 *   v1beta base URL. Both "embedding-001" and "text-embedding-004" return 404
 *   at that endpoint. Calling the REST API directly bypasses the SDK's routing
 *   and lets us hit the exact endpoint where "gemini-embedding-001" is available.
 *
 * Model  : gemini-embedding-001 (Google's current embedding model)
 * Output : number[768]  — trimmed to 768 dims to match vector(768) DB schema
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const EMBEDDING_MODEL = "gemini-embedding-001";

// Our DB schema uses vector(768). We always trim or pad to this length.
const EMBEDDING_DIMENSIONS = 768;

// REST API base URLs — tried in order until one works
const API_BASES = [
  "https://generativelanguage.googleapis.com/v1beta",
  "https://generativelanguage.googleapis.com/v1",
];

// Retry config — matches the resilience philosophy of the existing AI workers
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

// ─── Core: _callEmbedAPI ──────────────────────────────────────────────────────
/**
 * Call the Gemini embedContent REST endpoint directly.
 * Tries each base URL in order; moves on if the endpoint returns 404.
 *
 * @param {string} text     - Text to embed (pre-trimmed)
 * @param {string} apiKey   - Gemini API key
 * @returns {Promise<number[]>} - raw values array from the API
 */
async function _callEmbedAPI(text, apiKey) {
  const body = JSON.stringify({
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text }] },
    // outputDimensionality is supported on newer models; request 768 up front.
    // We slice to 768 afterward as a safety net in case it's ignored.
    outputDimensionality: EMBEDDING_DIMENSIONS,
  });

  const headers = { "Content-Type": "application/json" };

  for (const base of API_BASES) {
    const url = `${base}/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;

    let resp;
    try {
      resp = await fetch(url, { method: "POST", headers, body });
    } catch (networkError) {
      // Network-level failure (DNS, timeout) — try next base
      console.warn(`[EmbeddingService] Network error on ${base}: ${networkError.message}`);
      continue;
    }

    if (resp.ok) {
      const data = await resp.json();

      // REST response shape: { embedding: { values: number[] } }
      const values = data?.embedding?.values;

      if (!Array.isArray(values) || values.length === 0) {
        throw new Error(
          `[EmbeddingService] Unexpected response shape — embedding.values missing or empty`
        );
      }

      // Trim to 768 dims: gemini-embedding-001 may return more than 768
      // even when outputDimensionality is requested (graceful safety net)
      return values.slice(0, EMBEDDING_DIMENSIONS);
    }

    if (resp.status === 404) {
      // Model not on this base URL — try the next one
      const errText = await resp.text().catch(() => "");
      console.warn(`[EmbeddingService] 404 on ${base}: ${errText.slice(0, 120)} — trying next endpoint`);
      continue;
    }

    // Non-404 error — parse and throw (will be caught by retry loop)
    let errMessage = `HTTP ${resp.status}`;
    try {
      const errData = await resp.json();
      errMessage = errData?.error?.message || errMessage;
    } catch (_) {}
    throw new Error(`[${resp.status}] ${errMessage}`);
  }

  throw new Error(
    `${EMBEDDING_MODEL} not found on any API endpoint. Tried: ${API_BASES.join(", ")}`
  );
}

// ─── Core: generateEmbedding ──────────────────────────────────────────────────
/**
 * Generate a 768-dimensional embedding vector for `text`.
 *
 * @param {string} text - Text to embed (will be trimmed and truncated to 8000 chars)
 * @returns {Promise<number[]>} - 768-element float array
 *
 * Behaviour:
 * - Retries on 429 / 503 with exponential backoff
 * - Switches to fallback API key on attempt 3 (mirrors existing worker pattern)
 * - Throws after all retries exhausted (callers in cacheService/ragService catch this)
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== "string") {
    throw new Error("embeddingService: text must be a non-empty string");
  }

  const cleanText = text.trim().slice(0, 8000); // safe token-limit upper bound
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Switch to fallback API key on the final attempt if one is configured
    const useFallback = attempt >= 2 && !!process.env.GEMINI_FALLBACK_API_KEY;
    const apiKey = useFallback
      ? process.env.GEMINI_FALLBACK_API_KEY
      : process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        useFallback
          ? "GEMINI_FALLBACK_API_KEY is not set"
          : "NEXT_PUBLIC_GEMINI_API_KEY is not set"
      );
    }

    try {
      const values = await _callEmbedAPI(cleanText, apiKey);

      if (attempt > 0) {
        console.log(
          `[EmbeddingService] ✅ Succeeded on attempt ${attempt + 1}${useFallback ? " (fallback key)" : ""}`
        );
      }

      return values; // number[768]
    } catch (error) {
      lastError = error;

      const isRetryable =
        error.message.includes("429") ||
        error.message.includes("Too Many Requests") ||
        error.message.includes("503") ||
        error.message.includes("Resource has been exhausted") ||
        error.message.includes("Service Unavailable");

      if (isRetryable && attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt); // 500ms, 1000ms
        console.warn(
          `[EmbeddingService] Rate limited (attempt ${attempt + 1}/${MAX_RETRIES}). Retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }

      // Non-retryable (404, parse error, etc.) — break immediately
      if (!isRetryable) break;
    }
  }

  console.error("[EmbeddingService] All attempts exhausted:", lastError?.message);
  throw new Error(`Failed to generate embedding: ${lastError?.message}`);
}

// ─── Utility: formatVectorLiteral ─────────────────────────────────────────────
/**
 * Convert a number[] to the Postgres vector literal '[0.1,0.2,...]'.
 * Used by cacheService and ragService when writing raw SQL via sql`` templates.
 *
 * @param {number[]} embedding
 * @returns {string}
 */
export function formatVectorLiteral(embedding) {
  return `[${embedding.join(",")}]`;
}

// ─── Utility: batchGenerateEmbeddings ─────────────────────────────────────────
/**
 * Generate embeddings for multiple texts with rate-limit-aware throttling.
 * Processes sequentially in batches of `batchSize` with a pause between batches.
 *
 * @param {string[]} texts
 * @param {number}   batchSize - default 5; keeps sustained RPM well under limits
 * @returns {Promise<number[][]>}
 */
export async function batchGenerateEmbeddings(texts, batchSize = 5) {
  const results = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    // Sequential within each batch — gentle on the quota
    for (const text of batch) {
      const embedding = await generateEmbedding(text);
      results.push(embedding);
    }

    // 300 ms pause between batches — prevents sustained 429s on large ingestions
    if (i + batchSize < texts.length) {
      await sleep(300);
    }
  }

  return results;
}

// ─── Internal ─────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
