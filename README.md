# LearnForge

An AI learning platform built on event-driven architecture with Retrieval-Augmented Generation (RAG), embedding-based semantic caching, and an adaptive remediation loop. The system generates personalized courses, notes, flashcards, and quizzes -- orchestrated through async background workflows with full lifecycle control, retry safety, and fallback resilience.

---

## Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Request Lifecycle](#request-lifecycle)
- [Retrieval-Augmented Generation (RAG)](#retrieval-augmented-generation-rag)
- [Semantic Caching Layer](#semantic-caching-layer)
- [Adaptive Learning System](#adaptive-learning-system)
- [Async Workflow Engine (Inngest)](#async-workflow-engine-inngest)
- [AI Pipeline Design](#ai-pipeline-design)
- [State Machine and Lifecycle Control](#state-machine-and-lifecycle-control)
- [Data Model](#data-model)
- [Failure Handling and Resilience](#failure-handling-and-resilience)
- [Security Model](#security-model)
- [Frontend Integration](#frontend-integration)
- [Why This Is Not a Simple GPT Wrapper](#why-this-is-not-a-simple-gpt-wrapper)
- [How to Think About This System](#how-to-think-about-this-system)
- [Engineering Challenges Solved](#engineering-challenges-solved)
- [Tech Stack](#tech-stack)
- [How to Run](#how-to-run)

---

## System Overview

LearnForge is a modular monolith with event-driven processing. Users submit a topic and preferences; the system generates a structured course outline, per-topic study notes, flashcards, quizzes, and adaptive remediation plans. Every content generation request follows a deterministic pipeline:

```
User Request
    |
    v
API Layer (Next.js Route Handler)
    |--- Auth (Clerk server-side identity)
    |--- Input validation (Zod schema)
    |--- Quota enforcement (daily course limits)
    |--- State guard (prevent duplicate generation)
    |
    v
+------------------------------------------+
|         Async Workflow Engine             |
|              (Inngest)                    |
|                                          |
|  1. Identity guard (skip if completed)   |
|  2. Semantic cache check                 |
|     +-- HIT  --> return cached content   |
|     +-- MISS --> continue                |
|  3. RAG context retrieval (pgvector)     |
|  4. LLM call (Gemini) with RAG context   |
|  5. JSON validation + parsing            |
|  6. Persist result to PostgreSQL         |
|  7. Store in semantic cache              |
|  8. Ingest as RAG chunks for future use  |
+------------------------------------------+
    |
    v
PostgreSQL (Neon)
    |--- studyTypeContent row updated to "completed"
    |--- documentChunks populated with embeddings
    |--- semanticCache entry stored
    |
    v
Frontend Polling --> UI renders result
```

Every step in this pipeline is a discrete, idempotent Inngest step. If any step fails, Inngest retries from that step -- not from the beginning. Post-generation steps (cache storage, RAG ingestion) are non-blocking: their failure does not affect the generation lifecycle.

---

## Architecture

```
+------------------------------------------------------------------+
|                        Client (Next.js 15)                       |
|   Course Creation | Notes | Flashcards | Quiz | Weak Areas       |
+------------------------------------------------------------------+
         |                    |                         ^
         | POST               | POST                    | GET (polling)
         v                    v                         |
+------------------------------------------------------------------+
|                     API Layer (Route Handlers)                    |
|   Auth | Validation | Quota | State Guards | Event Dispatch      |
+------------------------------------------------------------------+
         |                    |
         | Sync (outline,     | Async (inngest.send)
         | notes, quiz save)  |
         v                    v
+-------------------+  +--------------------------------------+
|   PostgreSQL      |  |      Inngest Workflow Engine          |
|   (Neon + pgvector)|  |                                      |
|                   |  |  CreateNewUser                        |
|  - users          |  |  GenerateStudyTypeContent             |
|  - studyMaterial  |  |  GenerateRemedialContent              |
|  - topics         |  |                                      |
|  - studyTypeContent| |  Each function:                      |
|  - documentChunks |  |   step.run("identity guard")         |
|  - semanticCache  |  |   step.run("cache check")            |
|  - remedialContent|  |   step.run("RAG retrieval")          |
|  - quizAttempt    |  |   step.run("AI generation")          |
|  - paymentRecord  |  |   step.run("persist result")         |
+-------------------+  |   step.run("cache store")            |
         ^              |   step.run("RAG ingest")             |
         |              +--------------------------------------+
         |                    |
         |                    v
         |         +--------------------+
         |         |   Gemini API       |
         |         |   (Google AI)      |
         |         |                    |
         +---------+  Primary key       |
                   |  Fallback key      |
                   |  Embedding model   |
                   +--------------------+

Embedding Model : gemini-embedding-001 (768-dim)
Generation Model: gemini-3-flash-preview (high reasoning)
                  gemini-3.1-flash-lite-preview (high volume)
Vector Index    : HNSW (cosine, m=16, ef_construction=64)
```

### Architectural Style

Modular monolith with event-driven processing. Not microservices. Domain logic is separated into services (`ragService`, `cacheService`, `embeddingService`, `userStatsService`) while the application and database remain shared. All AI-heavy work is offloaded to Inngest background workers, keeping API response times fast.

---

## Request Lifecycle

### Course Generation (Synchronous)

```
POST /api/generate-course-outline
  --> Zod validation (courseId, topic, courseType, difficultyLevel)
  --> Clerk currentUser() identity extraction
  --> UserStatsService.incrementDailyCourseCount() (quota gate, returns 429 on exceed)
  --> Gemini call (SMART model, HIGH_REASONING_CONFIG)
  --> parseAiJson() with tolerant extraction (fenced blocks, nested JSON)
  --> normalizeCourseLayout() (sanitize chapter titles, enforce exactly 3 chapters)
  --> DB transaction: insert studyMaterial + batch insert topics
  --> On topic insert failure: rollback course insert
  --> Initialize progress counters (totalTopics, completedTopics, progressPercentage)
  --> Update user stats (streak, daily activity)
```

### Flashcard/Quiz Generation (Asynchronous)

```
POST /api/study-type-content
  --> Normalize type to lowercase
  --> Validate against ALLOWED_TYPES ["flashcard", "quiz"]
  --> Extract granular topics from chapter objects (not chapter titles)
  --> Check for existing (courseId, type) record
       - "completed" or "generating" --> return existing ID (no duplicate job)
       - "failed" --> reuse row, reset to "generating"
       - None --> insert new row (handle unique constraint race via onConflict)
  --> inngest.send("studyType.content")

Inngest Worker (GenerateStudyTypeContent):
  --> Identity guard: skip if row already "completed"
  --> Mark row as "generating", clear prior error
  --> Build RAG query from course title + chapters + topics
  --> Check semantic cache
       - HIT: save cached content, return immediately
       - NEAR HIT (similarity 0.80-0.88): hold as fallback
       - MISS: proceed to RAG + generation
  --> Retrieve RAG context (3-tier similarity search)
  --> Build enriched prompt (context prepended to original prompt)
  --> Call Gemini (FAST model, MEDIUM_REASONING_CONFIG)
  --> parseAiJson() for structured output
  --> Persist to studyTypeContent (status: "completed")
  --> Store result in semantic cache (non-blocking)
  --> Ingest generated content as RAG chunks (non-blocking)
  --> On failure: increment retryCount, store error message, set status "failed"
  --> On AI failure with near-hit available: use approximate cache as fallback
```

### Notes Generation (Synchronous)

```
POST /api/generate-topic-notes
  --> Load topic row by topicId
  --> Status guards:
       - "completed" --> return cached content
       - "generating" --> return 202
       - "failed" --> allow retry
       - other --> return 409 Conflict
  --> Mark topic as "generating"
  --> Gemini call (SMART model, markdown output)
  --> On success: store notesContent, set "completed"
  --> Recompute course progress (totalTopics, completedTopics, progressPercentage)
  --> On failure: set "failed", store error
```

---

## Retrieval-Augmented Generation (RAG)

### How It Works

The RAG pipeline has two phases: **ingestion** (write path) and **retrieval** (read path).

**Ingestion** (`ragService.ingestChunks`):

1. After AI generates content (flashcards, quiz, notes, remedial), the raw output is converted into semantic text chunks.
2. Structured JSON (flashcards, quizzes) is parsed into one self-contained sentence per item. Example: `"Topic: Loops. Question: What is a for loop? Answer: A for loop iterates over sequences."` This produces high-quality, semantically rich chunks that embed well.
3. Plain text (notes, markdown) uses sentence-aware character-window chunking (500 chars, 60 char overlap) without splitting mid-sentence.
4. Each chunk is embedded using `gemini-embedding-001` (768-dimensional vectors) via batch processing with rate-limit-aware throttling.
5. Chunks are stored in the `documentChunks` table with an HNSW index for fast approximate nearest-neighbor search.
6. Ingestion is idempotent: existing chunks for the same `(courseId, sourceType)` are deleted before re-inserting.

**Retrieval** (`ragService.retrieveContext`):

1. The incoming query is stripped of prompt boilerplate ("generate", "exactly", "json format") to produce a clean semantic query.
2. The cleaned query is embedded using the same model.
3. Three-tier similarity search executes against pgvector:

| Step | Scope | Similarity Threshold | Limit | Purpose |
|------|-------|---------------------|-------|---------|
| 1 | Same-course | >= 0.60 (configurable) | 10 | High-confidence, course-scoped |
| 2 | Same-course (relaxed) | >= 0.55 | 10 | Broader match within course |
| 3 | Cross-course | >= 0.65 | 3 | Global fallback (e.g., "Java OOP" reuses chunks from "Java Basics") |

4. Steps 1 and 2 only run when a `courseId` is provided. Step 3 runs only when both return zero results.
5. Results are deduplicated by topic, sliced to top-K (default 3), and formatted as a context block prepended to the original prompt.

**Prompt Enrichment** (`ragService.buildRAGPrompt`):

The original prompt is preserved exactly. The retrieved context block is prepended:

```
--- Relevant Course Context (same-course) ---
[Chunk 1]
Topic: Inheritance. Question: What is method overriding? ...
[Chunk 2]
Topic: Polymorphism. Explanation: Polymorphism allows ...
--- End of Context ---

Using the context above as reference, Generate exactly 10 flashcards ...
```

This grounds the LLM's generation in actual course content, reducing hallucination and improving topical consistency.

---

## Semantic Caching Layer

### Architecture

The semantic cache sits in front of every Gemini call for flashcards, quizzes, and remedial content. It uses a two-gate hit detection strategy to prevent false positives.

**Gate 1 -- Embedding Similarity:**
The incoming query is embedded and compared against stored query embeddings using cosine similarity via pgvector. Threshold: `>= 0.88`.

**Gate 2 -- Keyword Overlap:**
Even when vectors are close, embedding similarity alone treats "Java basics" and "Java OOP" as near-identical (same domain space). The keyword gate catches intent drift:
- Extract keywords from both current and cached queries (strip words <= 3 chars, ignore generic terms like "basics", "concepts", and study-type words like "flashcard", "quiz")
- Require overlap ratio >= 0.50 AND absolute overlap count >= 4

Both gates must pass for a cache HIT.

### Cache Behavior

| Similarity | Keyword Match | Result |
|-----------|---------------|--------|
| >= 0.88 | passes | HIT -- return cached content, skip LLM |
| 0.80 - 0.88 | any | NEAR HIT -- logged, held as fallback if AI fails |
| < 0.80 | any | MISS -- proceed to RAG + generation |

On HIT: the cached response is written directly to the `studyTypeContent` row. Hit count and last-accessed timestamp are updated (fire-and-forget).

On MISS: after successful generation, the query + response pair is stored in `semanticCache` with its embedding for future lookups.

**Near-hit fallback:** If AI generation fails and a near-hit exists (similarity 0.80-0.88), the approximate cached content is used as a degraded-but-functional response instead of failing the request entirely.

### Impact

- Eliminates redundant Gemini calls for semantically equivalent queries
- Reduces latency from seconds (LLM round-trip) to milliseconds (pgvector lookup)
- Reduces API cost proportionally to cache hit rate

---

## Adaptive Learning System

### Trigger

When a user completes a quiz and scores below the adaptive threshold (default: 60%), the `quiz-attempt` route fires an `adaptive.remediation` Inngest event. This is non-blocking: the quiz attempt is already saved before the event is dispatched.

### Pipeline

```
Quiz Score < 60%
    |
    v
inngest.send("adaptive.remediation")
    |
    v
GenerateRemedialContent (Inngest worker)
    |
    +-- Idempotency guard (skip if already completed for this attempt)
    +-- Create or reset remedial job row
    +-- Build RAG-enriched prompt with weak topics
    +-- Gemini generates targeted remediation plan
    +-- Persist as studyTypeContent (type: "remedial")
    +-- Mark remedial job as completed
```

### Output Schema

```json
{
  "remediationTitle": "Python Loops & Functions Remediation",
  "targetTopics": ["loops", "functions"],
  "studyPlan": [
    {
      "topic": "loops",
      "explanation": "Loops repeat a block of code...",
      "keyPoints": ["for loop iterates over sequences", "while loop runs until condition is false"],
      "practiceQuestion": "Write a for loop to print numbers 1-5",
      "answer": "for i in range(1, 6): print(i)"
    }
  ]
}
```

The remediation content is linked to the original quiz attempt via `quizAttemptId`, creating a traceable feedback loop: **mistakes --> weak topic extraction --> targeted content generation --> reinforcement**.

---

## Async Workflow Engine (Inngest)

### Why Async

Flashcard, quiz, and remedial generation involve multiple sequential steps: cache lookup, RAG retrieval, embedding generation, LLM inference, and post-processing. These are long-running operations (5-30 seconds) that would block the HTTP connection and degrade API responsiveness.

### How It Works

Inngest functions are composed of discrete `step.run()` blocks. Each step is:
- **Individually retryable**: if step 4 fails, Inngest retries from step 4, not step 1.
- **Durable**: step results are persisted between retries.
- **Observable**: each step has a human-readable label visible in the Inngest dashboard.

### Registered Functions

| Function | Event | Retries | Purpose |
|----------|-------|---------|---------|
| `CreateNewUser` | `user.create` | 1 | Idempotent user provisioning (upsert via `onConflictDoNothing`) |
| `GenerateStudyTypeContent` | `studyType.content` | 1 | Flashcard/quiz generation with RAG + cache pipeline |
| `GenerateRemedialContent` | `adaptive.remediation` | 2 | Targeted remediation for low quiz scores |

### Identity Guards

Every worker checks if the target row is already `completed` before doing any work. This prevents re-generation on Inngest retries when the original attempt actually succeeded but the acknowledgment was lost.

---

## AI Pipeline Design

### Model Selection

| Task | Model | Config | Reasoning |
|------|-------|--------|-----------|
| Course outline | `gemini-3-flash-preview` | HIGH_REASONING | Structural quality matters for course design |
| Topic notes | `gemini-3-flash-preview` | HIGH_REASONING (text output) | Explanatory depth requires stronger reasoning |
| Flashcards | `gemini-3.1-flash-lite-preview` | MEDIUM_REASONING | High-volume, lower-cost; quality is sufficient |
| Quizzes | `gemini-3.1-flash-lite-preview` | MEDIUM_REASONING | Same rationale as flashcards |
| Remedial plans | `gemini-3.1-flash-lite-preview` | MEDIUM_REASONING | Shorter output, actionable content |
| Embeddings | `gemini-embedding-001` | REST API (768-dim) | Direct REST call bypasses SDK routing issues |

### Per-Request Sessions

Every AI call creates a fresh `model.startChat()` instance. This prevents shared chat history across concurrent requests -- a concurrency bug that would cause cross-user context leakage.

### Prompt Centralization

All prompts are defined in `configs/prompts.js`. Each prompt is a function that accepts parameters (topic, chapters, difficulty) and returns a structured instruction string. Prompts explicitly request JSON output with strict schemas, key constraints (e.g., "EXACTLY 3 chapters", "correctAnswer MUST match one option"), and quality rules (e.g., "at least 4 application-based questions").

### JSON Parsing

AI output is parsed through `parseAiJson()`, a tolerant parser that handles:
1. Clean JSON strings
2. Markdown fenced code blocks (` ```json ... ``` `)
3. JSON embedded within surrounding text (brace/bracket depth tracking)

This prevents generation failures from minor formatting inconsistencies in LLM output.

### Fallback Strategy

```
Primary Gemini API key
    |
    +-- 429 / 503 / "Resource exhausted" --> switch to fallback key
    |                                          |
    |                                          +-- success --> reset to primary
    |                                          +-- failure --> throw
    |
    +-- Other errors --> throw immediately

Course outline has an additional manual-outline fallback:
if both keys fail, a generic 3-chapter structure is generated locally.
```

The fallback mechanism is implemented as a singleton (`GeminiWithFallback`) that swaps the API key at the `GoogleGenerativeAI` instance level, preserving the same model configuration and generation parameters.

---

## State Machine and Lifecycle Control

### Topic States

```
pending --> generating --> completed
                |
                v
              failed (retryable)
```

### Study Content States

```
generating --> completed
    |
    v
  failed (retryCount incremented, error stored)
```

### Remedial Content States

```
pending --> generating --> completed
                |
                v
              failed (retryCount incremented)
```

### Duplicate Prevention

| Layer | Mechanism |
|-------|-----------|
| API route | Check existing `(courseId, type)` row before insert |
| DB | Unique constraint on `(courseId, type)` in `studyTypeContent` |
| Race condition | `onConflictDoNothing` + fallback fetch on constraint violation |
| Worker | Identity guard: skip if row already `completed` |
| Notes route | Return cached content for `completed`, return 202 for `generating` |

---

## Data Model

```
users
  - id, name, email (unique, indexed)
  - isMember, customerId (Stripe)
  - streak, studyTime, completedCourses, progress, lastStudyDate
  - dailyCoursesCreated, lastCourseDate (quota tracking)
  - quizTotalAttempts, quizBestScore, quizAverageScore, quizLastScore
  - quizTotalPercentageSum (atomic average recomputation)

studyMaterial (Course)
  - courseId (indexed), courseType, topic, difficultyLevel
  - courseLayout (JSON: chapters, topics, summaries)
  - createdBy (indexed), status
  - totalTopics, completedTopics, progressPercentage (denormalized counters)

topics
  - courseId (indexed), chapterIndex, topicIndex
  - chapterTitle, topicTitle
  - notesContent, status, error
  - embedding (vector(768)) -- per-topic embedding for semantic search

studyTypeContent
  - courseId, type (unique constraint: courseId + type)
  - content (JSON: flashcards/quiz/remedial payload)
  - status, retryCount, error

documentChunks (RAG)
  - courseId (indexed), sourceType (indexed: 'notes' | 'outline' | 'flashcard' | 'quiz')
  - chunkIndex, content
  - embedding (vector(768), HNSW indexed)

semanticCache
  - queryText, queryEmbedding (vector(768), HNSW indexed)
  - response (JSON), studyType
  - hitCount, createdAt, lastAccessedAt

remedialContent
  - userId (indexed), courseId, quizAttemptId (indexed)
  - percentage, weakTopics (JSON: string[])
  - status, error, retryCount

quizAttempt
  - userId (indexed), courseId
  - score, totalQuestions, percentage, timeTaken

paymentRecord
  - customerId, sessionId (Stripe identifiers)
```

---

## Failure Handling and Resilience

### AI Failures

- **Rate limiting (429) / Service unavailable (503):** Switch to fallback API key. If fallback succeeds, reset to primary on next call.
- **Malformed JSON output:** `parseAiJson()` applies tolerant extraction (fenced blocks, depth-tracked slicing) before throwing.
- **Both keys exhausted:** Course outline uses a locally-generated manual fallback. Other content types mark the row as `failed` with `retryCount` incremented and `error` stored for diagnostics.
- **Near-hit cache fallback:** If generation fails and a near-hit cache entry exists (similarity 0.80-0.88), approximate cached content is used instead of failing entirely.

### Database Failures

- User stats reads retry with exponential backoff (3 attempts, 1s delay).
- Course creation cleans up partial state: if topic insert fails after course insert, the course row is deleted.
- All quiz stat updates use atomic SQL increments (`sql\`column + 1\``) to prevent read-modify-write race conditions between concurrent requests.
- Multi-table writes (course + topics) use transactional semantics.

### Webhook Failures

- Stripe webhooks verify signatures when `STRIPE_WEB_HOOK_KEY` is configured.
- Each event handler checks affected rows and logs warnings for missing users.
- Null-checks on sensitive fields (`customer_details.email`, `customer_email`) prevent crashes on incomplete webhook data.

### Embedding Failures

- `generateEmbedding()` retries 3 times with exponential backoff (500ms, 1000ms).
- On the final attempt, switches to fallback API key.
- `batchGenerateEmbeddings()` processes sequentially in batches of 5 with 300ms pauses between batches to stay under rate limits.

---

## Security Model

- **IDOR prevention:** All authenticated routes use `currentUser()` from Clerk server-side context. Client-provided identity parameters are ignored.
- **Route protection:** Clerk middleware guards `/dashboard`, `/create`, and `/course` routes.
- **Webhook integrity:** Stripe webhooks use signature verification via `stripe.webhooks.constructEvent()`.
- **Server-only secrets:** Database connection string, API keys, and Stripe secrets are never exposed to the client bundle.
- **Input validation:** Course creation uses Zod schema validation. Study type content validates against an allowlist of types.
- **Quota enforcement:** Daily course creation limits (free: 10, premium: unlimited) are enforced server-side before any AI call.

---

## Frontend Integration

The frontend reflects backend processing through lifecycle-aware UI states:

- **Polling:** After triggering async generation, the UI polls `/api/study-status` at intervals until the record transitions to `completed` or `failed`.
- **Status-driven rendering:** Components check the `status` field to show loading spinners, error messages with retry actions, or the final content.
- **Practice quiz aggregation:** `/api/practice-quiz` aggregates completed quiz content across all user courses, shuffles questions, and returns a cross-course mixed quiz (up to 10 questions).
- **Weak areas dashboard:** Surfaces low-score quiz attempts with linked remediation plans for targeted review.

---

## Why This Is Not a Simple GPT Wrapper

| Dimension | GPT Wrapper | LearnForge |
|-----------|------------|------------|
| **Context** | Sends raw user input to LLM | Retrieves semantically relevant course chunks via RAG and injects them as grounding context |
| **Caching** | Every request hits the LLM API | Embedding-based semantic cache with two-gate hit detection avoids redundant calls |
| **Processing** | Synchronous request-response | Long-running generation offloaded to durable async workflows with per-step retryability |
| **Resilience** | Single API key, no fallback | Primary/fallback key switching, near-hit cache fallback, manual outline fallback |
| **Data pipeline** | No ingestion or indexing | Generated content is chunked, embedded, and indexed in pgvector for future retrieval |
| **Feedback loop** | Static output | Quiz scores trigger adaptive remediation: mistakes drive targeted content generation |
| **Lifecycle** | Stateless | Full state machine (pending/generating/completed/failed) with duplicate prevention, idempotent retries, and progress tracking |
| **Concurrency** | Shared model state | Per-request AI sessions prevent cross-user context leakage |

---

## How to Think About This System

| Component | Role |
|-----------|------|
| **RAG pipeline** | Context provider -- retrieves relevant course material to ground LLM generation |
| **Semantic cache** | Cost and latency optimizer -- eliminates redundant LLM calls for equivalent queries |
| **LLM (Gemini)** | Reasoning engine -- generates structured educational content from enriched prompts |
| **Inngest** | Orchestration layer -- manages long-running, multi-step workflows with durability and retry |
| **pgvector** | Similarity search engine -- enables both RAG retrieval and cache lookups via HNSW-indexed cosine similarity |
| **PostgreSQL** | Source of truth -- stores all state, content, embeddings, and lifecycle metadata |
| **State machine** | Consistency enforcer -- explicit status transitions prevent duplicate work and enable safe retries |

---

## Engineering Challenges Solved

**Reducing hallucination:** Raw LLM calls produce content disconnected from the actual course material. The RAG pipeline retrieves semantically relevant chunks from previously generated course content and injects them into the prompt, grounding the LLM's output in real course data.

**Reducing cost:** Repeated or semantically equivalent queries (e.g., regenerating flashcards after a page refresh) previously required full LLM round-trips. The semantic cache layer intercepts these at the embedding level, serving cached responses in milliseconds instead of seconds.

**Handling long-running tasks:** AI generation with RAG retrieval and embedding generation takes 5-30 seconds. Inngest moves this off the request path into durable background workers with individually retryable steps, keeping API response times under 200ms.

**Preventing duplicate generation:** Concurrent requests, page refreshes, and Inngest retries all risk creating duplicate content. A multi-layer defense (status guards, unique constraints, race-safe upserts, identity guards in workers) ensures each `(courseId, type)` combination produces exactly one output.

**Ensuring data consistency:** Quiz stats use atomic SQL increments (`quizTotalAttempts + 1`, `GREATEST(quizBestScore, newScore)`) to prevent read-modify-write races. Course + topic creation uses transactional semantics with cleanup on partial failure.

**Preventing cross-user data leakage:** Shared `startChat()` instances would carry conversation history across requests. Per-request model factories ensure each AI call starts with a clean context.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Runtime | React 19 |
| Database | PostgreSQL (Neon serverless) |
| Vector search | pgvector with HNSW indexing |
| ORM | Drizzle ORM |
| Background jobs | Inngest (event-driven, step functions) |
| AI generation | Google Gemini (gemini-3-flash-preview, gemini-3.1-flash-lite-preview) |
| Embeddings | gemini-embedding-001 (768-dim, REST API) |
| Authentication | Clerk |
| Payments | Stripe (webhooks + checkout) |
| Validation | Zod |
| Styling | Tailwind CSS + Radix UI |

---

## How to Run

```bash
npm install
node scripts/enable-pgvector.js    # One-time: enable pgvector + create RAG/cache tables
npx drizzle-kit push               # Push schema to database
npm run dev                         # Start Next.js dev server
npx inngest-cli dev                 # Start Inngest dev server (background workers)
```

Required environment variables:

```
DATABASE_CONNECTION_STRING          # Neon PostgreSQL connection string
NEXT_PUBLIC_GEMINI_API_KEY          # Primary Gemini API key
GEMINI_FALLBACK_API_KEY             # Fallback Gemini API key (optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   # Clerk publishable key
CLERK_SECRET_KEY                    # Clerk secret key
STRIPE_SECRET_KEY                   # Stripe secret key
STRIPE_WEB_HOOK_KEY                 # Stripe webhook signing secret
```

Optional tuning:

```
GEMINI_MAX_OUTPUT_TOKENS            # Max tokens per generation (default: 8192)
RAG_TOP_K                          # Max RAG chunks per query (default: 3)
RAG_MIN_SIMILARITY                 # Primary retrieval threshold (default: 0.60)
RAG_FALLBACK_SIMILARITY            # Relaxed retrieval threshold (default: 0.55)
RAG_CROSS_COURSE_SIMILARITY        # Cross-course threshold (default: 0.65)
RAG_SIMILARITY_THRESHOLD           # Cache hit threshold (default: 0.88)
CACHE_MIN_OVERLAP_RATIO            # Keyword overlap ratio for cache (default: 0.50)
ADAPTIVE_SCORE_THRESHOLD           # Quiz score triggering remediation (default: 60)
```
