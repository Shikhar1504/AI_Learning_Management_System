# LearnForge

Event-driven AI LMS with async content pipelines and reliability-focused backend design.

---

AI-powered LMS that generates structured courses, topic notes, flashcards, and quizzes from a single prompt. The backend is built around Next.js route handlers, Drizzle/PostgreSQL, Inngest workers, Clerk auth, Stripe billing, and Gemini AI.

Designing a reliable AI pipeline required handling non-deterministic outputs, API failures, and long-running jobs without blocking user requests.

Why this project is interesting: it is a practical example of event-driven backend design with asynchronous AI pipelines, status-driven workflows, retry/fallback behavior, quota enforcement, database transactions, atomic writes, and denormalized progress tracking.

## 🚀 Project Overview

- Users submit a topic and learning preferences to generate a complete study path.
- The system persists course structure, topic state, generated content, quiz attempts, and subscription status in PostgreSQL.
- Long-running AI jobs are pushed out of the request path so the API remains responsive even when AI or database dependencies are slow.
- The backend emphasizes reliability and lifecycle control rather than only content generation.

## 🧠 System Architecture

- **API layer**
  - Next.js route handlers expose course generation, notes generation, flashcards/quiz generation, status polling, dashboard reads, user stats, and billing.
  - Each route owns a specific responsibility instead of one large orchestration layer.
  - All routes validate and normalize inputs before any DB or AI operation.

- **AI layer**
  - Gemini is used for course outlines, topic notes, flashcards, and quizzes.
  - Each request creates a fresh per-request chat session to prevent shared history across concurrent users.
  - The prompts request structured outputs so downstream code can validate, persist, and render the results predictably.

- **Background processing layer**
  - Inngest handles user creation and study-content generation as asynchronous events.
  - This decouples request timing from AI execution and makes retries explicit.
  - Workers include an identity guard that skips re-execution if a record is already completed, preventing duplicate AI jobs on retries.

- **Persistence layer**
  - Drizzle ORM writes to PostgreSQL tables for users, study materials, topics, study-type content, quiz attempts, and payments.
  - The database acts as the source of truth for state, progress, and content lifecycle.
  - Critical multi-table writes use database transactions so partial failures do not leave orphaned data.

- **Synchronous vs asynchronous execution**
  - Synchronous flows: course creation, topic reads, dashboard reads, quiz attempt writes, payment webhooks, and status queries.
  - Asynchronous flows: flashcard and quiz generation through Inngest, plus Clerk-driven user provisioning.
  - This split keeps user-facing requests fast while still supporting expensive AI work.

- **Request flow pattern**
  - Client submits request.
  - API normalizes and validates auth, inputs, and quotas.
  - API either writes directly to the DB inside a transaction, or enqueues an Inngest event.
  - Worker or route performs AI generation using a fresh per-request session.
  - Result is validated, persisted, and exposed through status-aware read endpoints.

- **Architecture style**
  - This is a modular monolith with event-driven processing, not a microservices system.
  - The codebase keeps related logic separated by domain, while sharing a single application and database boundary.

## 🔁 End-to-End Flow

- User Request
  - The frontend submits a course or content action.

- API Validation
  - Auth, quota, input shape, and request context are checked first. Type values are normalized to lowercase before any check.

- DB Write / Status Update
  - The system creates or updates the relevant record with a lifecycle status, wrapped in a transaction for multi-table writes.

- Inngest Event Trigger
  - Long-running study-content work is dispatched to the background when needed.

- AI Processing
  - Gemini generates the requested outline, notes, flashcards, or quiz data using a fresh chat session per request.

- Validation + Retry/Fallback
  - Output is parsed with dedicated try/catch on JSON parsing. Issues are caught and retried or rerouted to fallback logic.

- DB Update
  - The record is marked `completed` or `failed`, `retryCount` is incremented on failures, and related progress fields are refreshed.

- Frontend Polling → Response
  - The UI reads status endpoints until the job finishes and the final content is available.

## 🔄 Core Workflows

### Course Generation Flow

- User submits topic, course type, difficulty, and creator identity.
- `POST /api/generate-course-outline` first checks the user's daily quota through `UserStatsService.incrementDailyCourseCount()`.
- If the quota is exceeded, the request is rejected with `429` before any AI call is made.
- The route builds a prompt that asks Gemini for a JSON course outline with exactly three chapters, using a fresh per-request chat session.
- Gemini returns structured course data and the JSON response is parsed in a dedicated try/catch.
- The route validates chapter count and trims or pads the outline to preserve a fixed course shape.
- If Gemini fails or returns malformed output, the route falls back to a manual outline so the course creation request can still succeed.
- The course record and all topic rows are inserted inside a single database transaction — if topic insertion fails, the course record is also rolled back.
- Course progress counters are initialized in `studyMaterial` so later reads do not need to infer progress from scratch.
- User activity stats are updated for streak and daily usage tracking.

### Notes Generation Flow

- User selects a specific topic and requests notes generation.
- `POST /api/generate-topic-notes` loads the topic row first.
- If the topic already has `completed` status, the API returns cached content immediately.
- If the topic is already `generating`, the API returns `202` to prevent duplicate work.
- If the topic is in an unexpected state (not `pending` or `failed`), the API returns `409 Conflict`.
- Topics in `failed` state can be retried — the route allows both `pending → generating` and `failed → generating` transitions.
- The route marks the topic as `generating` before calling Gemini, using a fresh per-request chat session.
- The prompt instructs Gemini to generate concise markdown notes with explanation, key points, code example, and interview questions.
- On success, the notes are written back to `topics.notesContent` and the topic status becomes `completed`.
- The route then recomputes course-level totals and progress percentage from the full topic set.
- On failure, the topic status is set to `failed` so the user can retry.

### Flashcards / Quiz Generation Flow

- User chooses a study type such as flashcards or quiz.
- `POST /api/study-type-content` normalizes the type to lowercase before validation, then rejects unknown types with `400`.
- The API checks whether a record already exists for the same course and type.
- If a record is already `generating` or `completed`, the API returns the existing record ID without triggering Inngest — no duplicate jobs.
- If a prior attempt failed, the route reuses the record by switching it back to `generating`.
- If no record exists, a new `studyTypeContent` row is inserted. If a unique constraint violation is caught (race condition), the existing record is retrieved gracefully instead of throwing.
- The API sends an Inngest event with the study type, prompt, course ID, and record ID.
- The Inngest worker first checks if the record is already `completed` (identity guard) and returns early if so, preventing duplicate AI work on Inngest retries.
- The worker then marks the record as `generating` and clears any previous error before starting AI generation.
- Flashcard and quiz generation use a fresh per-request model session to avoid shared state across concurrent jobs.
- On failure, `retryCount` is incremented and the `error` field is updated for debugging.
- Frontend polling checks `/api/study-status` until generation is complete (type param is also normalized in this endpoint).
- This design avoids blocking the request and keeps study-content generation resilient under load.

### Retry + Fallback Flow

- If Gemini returns 429, 503, or resource exhaustion errors, the system attempts to switch to a fallback API key.
- If the fallback key works, generation continues without failing the user request.
- If fallback generation succeeds, the system resets back to the primary key afterward.
- If both AI paths fail, the affected topic or content row is marked `failed` with the error message written to the `error` column.
- JSON parsing failures are caught separately and surface a clear error message rather than a generic crash.
- Inngest functions are configured with retries so background jobs can survive temporary service issues.

## 🤖 AI Pipeline Design

- Prompt design
  - Each AI task uses a specific prompt shape tailored to the output type.
  - Course generation requests JSON course structure.
  - Notes generation requests concise markdown.
  - Flashcards and quizzes request JSON objects with fixed keys.
  - **Decoupled Configuration:** AI instruction strings and business logic are fully decoupled from HTTP routing. All generative prompts are maintained in an independent configuration layer (`configs/prompts.js`) for cleaner code organization and easier prompt tuning.

- Per-request sessions
  - All AI model instances are created fresh inside each route handler or Inngest step run.
  - This prevents shared chat history between concurrent requests, which previously could cause responses to mix context across users.

- Validation step
  - JSON output is parsed inside a dedicated try/catch, separate from the outer error handler.
  - Course chapter counts are validated and normalized to exactly three chapters.
  - Quiz and flashcard records are filtered so only structurally valid outputs are accepted.
  - Quiz payload contract is stable: the frontend accepts either a raw array of questions or an object with `questions`, where each question includes `question`, `options[]`, and `answer` (optional `id` is ignored by rendering logic).

- Storage step
  - Valid AI output is persisted in `studyMaterial`, `topics`, or `studyTypeContent` depending on the workflow.
  - Persisted status fields allow later reads and polling to understand exactly where the item is in the lifecycle.

- Fallback logic
  - The system can switch from the primary Gemini key to the fallback key on overload or rate-limit errors.
  - If the fallback succeeds, the key is reset so the app does not remain in fallback mode longer than necessary.
  - Course generation also has a manual outline fallback so creation can still complete even when AI is unavailable.

- Error scenarios handled
  - Malformed JSON from the model (caught at the parse step, not the outer handler).
  - Quota or rate-limit errors.
  - AI service timeouts or overload.
  - Partial generation where a row must be left in a retryable state with an error message stored.

## 🧩 State Management / Lifecycle

- Topic status lifecycle
  - `pending`: topic exists but notes have not been generated yet.
  - `generating`: a generation job is currently in progress.
  - `completed`: notes were generated and stored successfully.
  - `failed`: generation failed; retries are allowed from this state.

- Study-content status lifecycle
  - `generating`: async content generation is underway.
  - `completed`: flashcards or quiz content is ready.
  - `failed`: the job failed; `retryCount` is incremented and `error` stores the reason.

- Duplicate generation prevention
  - The notes route checks status before starting work and rejects non-pending/failed states with `409`.
  - The study-content route reuses an existing row when one already exists.
  - The Inngest worker checks if a record is already `completed` before executing (identity guard).
  - Returning `202` or cached content prevents duplicate AI calls and duplicate inserts.

- Idempotent-like behavior
  - State checks make repeated requests safe in practice.
  - Existing records are reused instead of always creating new rows.
  - Status transitions are explicit, which makes retries predictable and easier to reason about.

## ⚙️ Key Engineering Decisions

- Why async (Inngest)?
  - Flashcards and quizzes can take long enough to degrade a normal request-response path.
  - Moving that work to background jobs keeps the API responsive and prevents user-facing timeouts.
  - Inngest also gives the project event-driven orchestration instead of hand-rolled polling or job queues.

- Why database transactions?
  - Course creation writes to two tables. Without a transaction, a crash between the two writes leaves a course record with no topics, making the course inaccessible.
  - Course deletion also uses a transaction — previously, a crash mid-deletion could leave orphaned topic and content rows with no parent course.

- Why atomic SQL increments for quiz stats?
  - The original approach read the current count, incremented in JavaScript, and wrote back. Two concurrent requests would both read the same stale value and lose an update.
  - Using `sql\`col + 1\`` pushes the increment into PostgreSQL, which applies it atomically regardless of concurrent requests.

- Why per-request AI model factories?
  - The original code created one shared `startChat()` instance at module load. Gemini chat sessions accumulate history.
  - Concurrent requests using the same session would mix each other's conversation context, causing unreliable outputs.
  - The factory function pattern creates a fresh session per call, eliminating this concurrency bug.

- Why retries?
  - AI, network, and database failures are often transient rather than permanent.
  - Retries reduce the chance that a user sees failure for a short-lived outage.
  - The retry model is especially useful for background jobs where eventual completion is better than immediate rejection.

- Why fallback API key?
  - AI providers can rate limit or exhaust the primary key during bursts.
  - A fallback key helps preserve availability when the primary path is saturated.
  - This is a practical resilience layer, not just a convenience feature.

- Why JSON validation?
  - The app needs machine-readable output for storing and later rendering content.
  - Validation protects the DB from malformed model output.
  - It also keeps frontend consumers from failing on unexpected shapes.

- Why store progress in the DB?
  - The dashboard and content pages need fast reads.
  - Denormalized progress fields avoid expensive recomputation on every request.
  - This also makes the UI resilient when some topic rows are still being generated.

- Why DRY and Centralized Fallback logic?
  - Extracted repetitive Gemini rate-limit fallback scenarios into a single modular helper (`runAiWithFallback`), demonstrating strict adherence to the DRY (Don't Repeat Yourself) principle.

- Why normalize string checks on the frontend?
  - Generative AI models occasionally output JSON responses with trailing invisible whitespaces or unexpected capitalization. Passing these strings through normalizations (`.trim().toLowerCase()`) ensures user evaluations do not glitch due to invisible hallucinations.

- Why propagate backend AI errors to the frontend UI?
  - Instead of generic "Something went wrong" messages, we persist explicit API exception strings (e.g., "503 High Demand") in PostgreSQL and stream them natively into the Next.js frontend polling mechanism. This creates total transparency for the end user and dramatically improves UX and debuggability.

## 🧩 System Design Concepts Used

- **Event-driven architecture**
  - Used when Clerk user creation and study-content generation are turned into Inngest events.
  - Decouples request intake from heavy processing and makes the system easier to scale.

- **Async processing**
  - Used for flashcard and quiz generation.
  - Prevents the main API request from waiting on AI completion.
  - Lets the UI poll a status endpoint instead of holding an open request.

- **Database transactions**
  - Used for course creation (study material + topics) and course deletion (study material + topics + study content).
  - Ensures multi-table writes are atomic — either all succeed or all roll back.

- **Atomic SQL writes**
  - Used for quiz stat counters (attempts, best score, average).
  - Eliminates the Read-Modify-Write race condition that could silently drop data under concurrent load.

- **Database constraints and Normalization**
  - Used on `studyTypeContent (courseId, type)` and `users (email)` to enforce data integrity and idempotency at the DB level, preventing duplicate inputs even under race conditions.
  - Normalised tables (like `quizAttempt`) strictly reference primary keys (`userId`) instead of transient strings (like emails) to preserve relational integrity across Postgres schemas.

- **Retry mechanisms**
  - Used in Inngest functions and database reads.
  - Helps the system tolerate temporary provider or network issues.
  - Improves completion rate without adding complexity to the UI.

- **Rate limiting and quotas**
  - Used in course generation with daily course limits per user.
  - Free users are capped while paying users have a much higher ceiling.
  - Protects the AI layer and controls cost exposure.

- **Data consistency**
  - Used through explicit status transitions, database transactions, and persisted progress fields.
  - Course, topic, and content records act as the source of truth.
  - Reads can always reconstruct what happened even after partial failures.

- **API design and Validation**
  - Used with clear endpoint boundaries, normalized inputs, and predictable responses.
  - Incoming JSON bodies are strictly typed and vetted using **Zod** schemas, shielding internal business logic and AI prompts from unexpected client inputs.
  - Implemented a standardized API contract (`{ success: boolean, data/error: payload }`) globally across all endpoints to simplify frontend parsing and error handling.
  - Status endpoints support polling without leaking implementation details.

## 🗃️ Data Model Overview

- User (`users`)
  - Stores identity, membership state, streak, study time, completed courses, daily course usage, and quiz performance counters.
  - Acts as the aggregate profile for dashboard analytics and quota enforcement.

- Course (`studyMaterial`)
  - Stores the AI-generated course outline, course type, topic, difficulty, creator, and progress fields.
  - One course owns many topics and can also own generated study content.

- Topic (`topics`)
  - Stores chapter index, topic index, chapter title, topic title, notes content, and status.
  - Enables fine-grained generation and progress tracking per learning unit.

- StudyContent (`studyTypeContent`)
  - Stores flashcards or quiz payloads for a given course and study type.
  - Has a unique constraint on `(courseId, type)` to prevent duplicate records at the schema level.
  - Includes `retryCount` and `error` fields for debugging and retry tracking.
  - Supports async generation, retry, and polling-based completion.

- QuizAttempt (`quizAttempt`)
  - Stores submitted quiz scores, question counts, percentages, and timing.
  - Feeds the user's quiz summary and historical performance metrics.

- PaymentRecord (`paymentRecord`)
  - Stores payment-related identifiers for subscription tracking.
  - Used alongside Stripe webhooks to maintain member state.

## 🔥 Failure Handling Strategy

- AI failures
  - If the model fails due to quota, overload, or malformed output, the system tries fallback logic first.
  - JSON parse errors are caught at the parse step and surfaced with a clear message rather than as a generic crash.
  - If generation still fails, the relevant row is left in `failed` state with the error message stored, and `retryCount` incremented.

- DB failures
  - Course listing uses retry with exponential backoff.
  - When a DB failure occurs on a course read, the API returns a proper `503` error instead of fabricating fake course content.
  - Multi-table writes are wrapped in transactions so partial failures do not produce inconsistent state.

- Stripe webhook failures
  - All DB updates in the webhook handler check the number of affected rows using `.returning()`.
  - If an update matches zero rows (user not found), a warning is logged so the gap is visible in monitoring.
  - Null safety is applied to all email and customer fields before the DB call.
  - Unsafe system logs during checkout and billing flows are replaced with clean, user-facing toasts to prevent data leakage in production.

- Retry logic
  - Inngest functions are retried automatically.
  - The Inngest worker includes an identity guard to skip re-execution when a record is already completed, preventing wasted AI calls on retries.
  - Existing rows are reused where possible so retries do not create duplicate content.
  - Status fields make retry behavior visible and controllable.

- Fallback behavior
  - Primary Gemini key failure can roll over to the fallback key.
  - Course generation can degrade to a manual outline.
  - Topic generation can return cached content if it already exists.

## ⚡ Performance & Reliability

- Non-blocking APIs keep interactive requests fast.
- Background jobs isolate AI latency from the user's browser session.
- Atomic SQL increments eliminate race conditions on frequently updated counters.
- Database transactions ensure multi-table writes are consistent even during failures.
- Per-request AI sessions eliminate shared state between concurrent users.
- Quotas protect the system from uncontrolled usage and cost spikes.
- Status-based reads allow the frontend to poll cheaply instead of re-triggering generation.
- Denormalized counters make dashboard reads cheaper and simpler.
- Cached topic content avoids repeated AI calls for the same data.

## 📈 Scalability Considerations

- Async jobs scale better
  - Heavy AI work moves into background processing where it can be retried and isolated from request latency.
  - The API can serve more users because it spends less time waiting on generation.

- Avoiding blocking
  - Notes and study-content generation do not hold the HTTP request open longer than needed.
  - Status polling replaces long-lived requests with short reads.

- Quotas as protection
  - Daily course limits prevent a single user from saturating the AI layer.
  - Subscription-based allowances provide a simple cost-control boundary.

- Data design for scale
  - Storing generated results in the DB enables reuse and reduces recomputation.
  - Status and progress fields make it easier to query current state without scanning every record.
  - Unique constraints on `studyTypeContent` prevent the system from writing duplicate rows even under high concurrency.

## 🔐 Security

- **IDOR Prevention:** Eliminated Insecure Direct Object Reference (IDOR) vulnerabilities by strictly extracting user identity via server-side session tokens (`currentUser()`), explicitly ignoring client-provided user identifiers in all sensitive API requests.
- Clerk middleware protects private application routes.
- Authenticated routes rely on server-side user context instead of client trust.
- Clerk and Stripe webhooks use signature verification.
- Database connection string is stored as a server-only environment variable (no `NEXT_PUBLIC_` prefix) so it is never bundled into the browser.
- Sensitive tokens remain server-side.
- Billing and user provisioning are executed exclusively through trusted backend handlers, completely eliminating direct client-side database access from upgrade flows.

## 🛠️ Tech Stack

- Next.js 15 App Router
- React 19
- PostgreSQL
- Drizzle ORM
- Inngest
- Google Gemini AI
- Clerk authentication
- Stripe billing
- Tailwind CSS
- Radix UI

## 🚀 How to Run

```bash
npm install
npx drizzle-kit push
npm run dev
npx inngest-cli dev
```

## 💼 Resume-Level Summary

Designed a highly scalable, event-driven AI content pipeline with lifecycle management, normalized PostgreSQL Database architecture using Drizzle ORM, and atomic SQL increments to eliminate race conditions. Implemented robust Zod API schema validations, retry-safe asynchronous background jobs (Inngest) utilizing idempotent "Upsert" inserts, per-request AI session isolation, and DRY fallback API-key logic to gracefully handle unreliable external AI services. Secured the API layer against IDOR vulnerabilities through strict server-side identity validation. Engineered transparent diagnostic polling, propagating root-cause AI server crashes natively into the frontend UI layer for enterprise-grade UX and robustness.
