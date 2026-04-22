# LearnForge

## ⚡ TL;DR

Event-driven AI LMS built with async pipelines (Inngest), PostgreSQL + Drizzle, and Gemini AI.  
It uses retry-safe background jobs, idempotent APIs, DB transactions, and secure server-side auth.  
Focus: reliability, non-blocking design, and real backend system patterns.

AI-powered LMS that generates structured courses, topic notes, flashcards, and quizzes from a single prompt.  
The backend uses Next.js route handlers, Drizzle/PostgreSQL, Inngest workers, Clerk auth, Stripe billing, and Gemini AI.

Designing a reliable AI pipeline required handling non-deterministic outputs, API failures, and long-running jobs without blocking user requests.

Why this project matters: practical event-driven backend design, async AI pipelines, status-driven workflows, retry/fallback behavior, quota enforcement, database transactions, atomic writes, and denormalized progress tracking.

---

## 🚀 Project Overview

- Users submit a topic and learning preferences to generate a complete study path.
- The system stores course structure, topic state, generated content, quiz attempts, and subscription status in PostgreSQL.
- Long-running AI jobs move out of the request path, so the API stays responsive.
- The backend focuses on reliability and lifecycle control, not only content generation.

---

## 🧠 System Architecture

```text
Client
  ↓
API (Next.js)
  ↓
DB + Inngest
  ↓
AI (Gemini)
  ↓
DB
  ↓
Polling → UI
```

### API Layer

- Next.js route handlers expose:
  - course generation
  - notes generation
  - flashcards/quiz generation
  - status polling
  - dashboard reads
  - user stats
  - billing
- Each route has one job.
- Inputs are validated and normalized before DB/AI work starts.

### AI Layer

- Gemini generates:
  - course outlines
  - topic notes
  - flashcards
  - quizzes
- Each request uses a fresh per-request chat session.
- Prompts request structured output for clean validation/storage.

### Background Processing Layer

- Inngest handles user creation and study-content generation as async events.
- Request timing is decoupled from AI execution.
- Workers include identity guards so completed records are not reprocessed on retries.

### Persistence Layer

- Drizzle ORM writes to PostgreSQL tables for:
  - users
  - study materials
  - topics
  - study-type content
  - quiz attempts
  - payments
- Database is the source of truth for state/progress/lifecycle.
- Critical multi-table writes use transactions.

### Sync vs Async

- **Sync:** course creation, topic reads, dashboard reads, quiz attempt writes, payment webhooks, status queries.
- **Async:** flashcard/quiz generation (Inngest), Clerk-driven user provisioning.

### Request Flow

1. Client submits a request.
2. API validates auth, input, and quotas.
3. API either writes in a transaction or queues an Inngest event.
4. Worker/route runs AI generation with a fresh session.
5. Result is validated, stored, and exposed through status-aware reads.

### Architecture Style

- Modular monolith with event-driven processing.
- Not microservices.
- Domain logic is separated while app/database remain shared.

---

## 🔁 End-to-End Flow

1. **User Request**  
   Frontend submits a course/content action.

2. **API Validation**  
   Auth, quota, input shape, and context checks run first.  
   Type values are normalized to lowercase before validation.

3. **DB Write / Status Update**  
   Records are created/updated with lifecycle status.  
   Multi-table writes run in transactions.

4. **Inngest Event Trigger**  
   Long-running content generation moves to background workers.

5. **AI Processing**  
   Gemini generates outline/notes/flashcards/quiz data using fresh sessions.

6. **Validation + Retry/Fallback**  
   Output parsing runs in dedicated try/catch.  
   Failures trigger retries or fallback logic.

7. **DB Update**  
   Record status becomes `completed` or `failed`.  
   `retryCount` increases on failures.  
   Progress fields are recalculated.

8. **Frontend Polling → Response**  
   UI polls status endpoints until generation completes.

---

## 🔄 Core Workflows

### Course Generation Flow

- User submits topic, course type, difficulty, creator identity.
- `POST /api/generate-course-outline` checks daily quota via `UserStatsService.incrementDailyCourseCount()`.
- If quota exceeded, route returns `429` before AI call.
- Route builds prompt for JSON outline with exactly three chapters.
- Gemini returns structured data.
- JSON parsing happens in dedicated try/catch.
- Route validates chapter count and trims/pads to fixed shape.
- If Gemini fails or returns malformed output, route uses manual-outline fallback.
- Course + topic inserts run in one DB transaction.
- If topic insert fails, course insert is rolled back.
- Progress counters initialize in `studyMaterial`.
- User activity stats update (streak + daily usage).

### Notes Generation Flow

- User selects topic and requests notes.
- `POST /api/generate-topic-notes` loads topic row first.
- If already `completed`, cached content is returned.
- If already `generating`, API returns `202`.
- If unexpected state, API returns `409 Conflict`.
- `failed` state supports retry.
- Route marks topic as `generating` before Gemini call.
- Prompt requests concise markdown with:
  - explanation
  - key points
  - code example
  - interview questions
- On success: write `topics.notesContent`, set status `completed`.
- Recompute course totals/progress percentage.
- On failure: set status `failed`.

### Flashcards / Quiz Generation Flow

- User chooses flashcards or quiz.
- `POST /api/study-type-content` normalizes `type` to lowercase before validation.
- Unknown types return `400`.
- API checks for existing `(courseId, type)` row.
- If existing row is `generating` or `completed`, return existing ID.
- Prevents duplicate jobs.
- If prior attempt `failed`, reuse row and set back to `generating`.
- If no row exists, insert new `studyTypeContent`.
- On unique-constraint race, safely fetch existing row instead of throwing.
- API sends Inngest event with type, prompt, course ID, and record ID.
- Worker exits early if row is already `completed`.
- Worker sets `generating` and clears prior error.
- Flashcard/quiz generation uses fresh per-request model session.
- On failure, increment `retryCount` and update `error`.
- Frontend polls `/api/study-status` until ready.

### Retry + Fallback Flow

- On Gemini `429`, `503`, or resource exhaustion, switch to fallback API key.
- If fallback succeeds, continue and reset to primary key after success.
- If both fail, row is marked `failed`.
- Error message is stored in `error` column.
- JSON parsing errors are handled separately.
- Inngest retries absorb transient failures.

---

## 🤖 AI Pipeline Design

### Prompt Design

- Task-specific prompts per output type.
- Course generation requests JSON structure.
- Notes generation requests markdown.
- Flashcards/quizzes request JSON with fixed keys.
- Prompts centralized in `configs/prompts.js`.

### Per-Request Sessions

- Fresh model instance created inside each route/worker.
- Prevents shared chat history and cross-request context bleed.

### Validation Step

- JSON parsed in dedicated try/catch.
- Course chapter count normalized to exactly 3.
- Quiz/flashcard payloads filtered to valid records only.

### Storage Step

- Valid output stored in `studyMaterial`, `topics`, or `studyTypeContent`.
- Status fields drive polling and lifecycle reads.

### Fallback Logic

- Switch from primary Gemini key to fallback key on overload/rate limits.
- Reset back to primary after successful call.
- Course generation also includes manual-outline fallback.

### Error Scenarios Handled

- Malformed model JSON.
- Quota/rate-limit failures.
- AI timeouts/overload.
- Partial generation requiring retryability.

---

## 🧩 State Management / Lifecycle

### Topic Status

- `pending`: topic exists, notes not generated.
- `generating`: generation in progress.
- `completed`: notes persisted.
- `failed`: generation failed; retries allowed.

### Study-Content Status

- `generating`: async generation running.
- `completed`: flashcards/quiz ready.
- `failed`: failed; `retryCount` incremented and `error` captured.

### Duplicate Generation Prevention

- Notes route checks status before work.
- Study-content route reuses existing row.
- Worker skips already-completed rows.
- Returning `202` or cached payload prevents duplicate AI calls/inserts.

### Idempotent-like Behavior

- Repeated requests are safe in practice.
- Existing records reused instead of repeatedly inserting.
- Explicit state transitions make retries predictable.

---

## ⚙️ Key Engineering Decisions

- **Why async (Inngest)?**  
  Flashcards/quizzes are long-running; background jobs keep APIs responsive.

- **Why DB transactions?**  
  Multi-table operations (create/delete course) must stay atomic.

- **Why atomic SQL increments for quiz stats?**  
  Prevent read-modify-write races via DB-side updates (e.g., `sql\`${col} + 1\``).

- **Why per-request AI model factories?**  
  Avoid shared history and cross-user context leakage.

- **Why retries?**  
  External AI/network/DB errors are often transient.

- **Why fallback API key?**  
  Improves availability under provider throttling.

- **Why JSON validation?**  
  Protects database/frontend from malformed AI output.

- **Why store progress in DB?**  
  Fast dashboard reads with denormalized counters.

- **Why centralized fallback logic (DRY)?**  
  Less duplication, easier tuning.

- **Why frontend string normalization?**  
  Avoid glitches from casing/whitespace inconsistencies.

- **Why propagate backend AI errors to UI?**  
  Better observability and user transparency.

---

## 🧩 System Design Concepts Used

- Event-driven architecture
- Async processing
- Database transactions
- Atomic SQL writes
- DB constraints and normalization
- Retry mechanisms
- Rate limiting and quotas
- Data consistency via explicit state transitions
- API input normalization and validation
- Pollable status endpoints

---

## 🗃️ Data Model Overview

### `users` (User)

Identity, membership, streak, study time, completed courses, daily usage, quiz stats.

### `studyMaterial` (Course)

Generated course outline, type, topic, difficulty, creator, and progress fields.

### `topics` (Topic)

Chapter/topic indexing, titles, notes content, and generation status.

### `studyTypeContent` (StudyContent)

Flashcards/quiz payload per course/type.  
Unique constraint: `(courseId, type)` plus `retryCount` and `error`.

### `quizAttempt` (QuizAttempt)

Scores, totals, percentages, timing, and quiz history.

### `paymentRecord` (PaymentRecord)

Payment identifiers and subscription state from Stripe webhooks.

---

## 🔥 Failure Handling Strategy

### AI Failures

- Fallback key on quota/overload/resource exhaustion.
- Separate JSON parse error handling.
- Persist failed state with retryability metadata.

### DB Failures

- Course listing retries with exponential backoff.
- Read failures return proper errors (no fake fallback data).
- Multi-table writes protected with transactions.

### Stripe Webhook Failures

- Verify affected rows.
- Log missing users clearly.
- Null-check sensitive webhook fields.

### Retry Logic

- Inngest retries for transient failures.
- Worker skips completed rows.
- Reused rows prevent duplicate content.

### Fallback Behavior

- Primary Gemini → fallback key rollover.
- Course generation manual-outline fallback.
- Notes route may return cached completed content.

---

## ⚡ Performance & Reliability

- Non-blocking APIs for interactive responsiveness
- Background jobs isolate AI latency
- Atomic SQL increments remove counter races
- Transactions ensure write consistency
- Per-request AI sessions avoid shared state
- Quotas prevent cost spikes
- Status polling keeps UI simple
- Denormalized counters speed dashboard reads
- Cached content avoids repeated AI calls

---

## 📈 Scalability Considerations

- Heavy AI work moved to background jobs
- API can handle more concurrent users
- No long-held HTTP connections for generation
- Polling replaces long-lived request lifecycles
- Daily/subscription limits protect cost and throughput
- Unique constraints prevent duplicate writes under load

---

## 🔐 Security

- **IDOR prevention:** strict server-side `currentUser()` identity checks
- Client-provided sensitive identifiers are ignored
- Clerk middleware protects private routes
- Authenticated routes use server-side context
- Clerk and Stripe webhooks use signature verification
- DB connection string remains server-only
- Secrets/tokens never exposed to client
- Billing/provisioning only via trusted backend handlers

---

## 🛠️ Tech Stack

- Next.js 15 (App Router)
- React 19
- PostgreSQL
- Drizzle ORM
- Inngest
- Google Gemini AI
- Clerk Authentication
- Stripe Billing
- Tailwind CSS
- Radix UI

---

## 🚀 How to Run

```bash
npm install
npx drizzle-kit push
npm run dev
npx inngest-cli dev
```

---

## 💼 Resume-Level Summary

Designed a scalable, event-driven AI content pipeline with lifecycle management, PostgreSQL transactions, and atomic SQL increments to eliminate race conditions. Implemented retry-safe background jobs with Inngest, per-request AI session isolation, and fallback API-key logic to handle unreliable external AI services. Secured the API layer against IDOR vulnerabilities with strict server-side identity validation.
