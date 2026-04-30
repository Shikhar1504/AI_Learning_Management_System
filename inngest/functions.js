import {
  createFlashcardAiModel,
  createQuizAiModel,
  geminiWithFallback,
  getModel,
  MEDIUM_REASONING_CONFIG,
  MODELS,
} from "@/configs/AiModel";
import { db } from "@/configs/db";
import {
  STUDY_TYPE_CONTENT_TABLE,
  USER_TABLE,
  REMEDIAL_CONTENT_TABLE,
  STUDY_MATERIAL_TABLE,
} from "@/configs/schema";
import { eq, sql } from "drizzle-orm";
import { inngest } from "./client";
import { parseAiJson } from "@/lib/parseAiJson";
import { checkCache, storeCache } from "@/lib/services/cacheService";
import {
  retrieveContext,
  buildRAGPrompt,
  buildRAGQuery,
  ingestChunks,
} from "@/lib/services/ragService";

/* 
🚀 How This Works (Inngest Flow) 🚀

1️⃣ The frontend calls `CheckIsNewUser()`, sending a POST request to `/api/create-user`.
2️⃣ The `/api/create-user` API receives the request and triggers an **Inngest event** named `"user.create"`.
3️⃣ Inngest listens for this event and automatically calls the `CreateNewUser` function.
4️⃣ `CreateNewUser` checks if the user already exists in the database.
   - If the user **does not exist**, they are added to the database.
   - If the user **already exists**, nothing changes.
5️⃣ The process happens in the background, so the frontend is not blocked while the user is being checked.

✅ **Key Point:**  
The connection happens because the event name (`"user.create"`) in `inngest.send()` matches the event listener in `CreateNewUser`.  
*/

export const CreateNewUser = inngest.createFunction(
  { id: "create-user", retries: 1, triggers: [{ event: "user.create" }] },
  async ({ event, step }) => {
    const { user } = event.data;
    console.log("Received user data:", JSON.stringify(user, null, 2)); // Add logging to see what data we receive
    // Get Event Data
    const result = await step.run(
      "Checking if the user exists in the database...",
      async () => {
        // Check Is User Already Exist
        const email = user?.primaryEmailAddress?.emailAddress;
        console.log("Checking for email:", email); // Add logging to see what email we're checking

        if (!email) {
          console.error("Email not found in user data");
          return [];
        }

        // Use an idempotent Upsert method to avoid Check-Then-Act race condition duplicates
        const insertResult = await db
          .insert(USER_TABLE)
          .values({
            id: crypto.randomUUID(),
            name: user?.fullName || email.split("@")[0],
            email: email,
          })
          .onConflictDoNothing({ target: USER_TABLE.email })
          .returning();

        if (insertResult.length > 0) {
          console.log("Created new user with email:", email);
          return insertResult;
        } else {
          // User already exists, fetch them safely
          const existingUser = await db
            .select()
            .from(USER_TABLE)
            .where(eq(USER_TABLE.email, email));
          return existingUser;
        }
      },
    );
    return result?.length === 0
      ? "New user successfully created."
      : "User already exists in the database.";
  },
);

// Generate Study Type Content
export const GenerateStudyTypeContent = inngest.createFunction(
  {
    id: "Generate Study Type Content",
    retries: 1,
    triggers: [{ event: "studyType.content" }],
  },
  async ({ event, step }) => {
    const { studyType, prompt, courseId, recordId } = event.data;
    let AiResult = null; // Initialize AI result

    // Fix #3: Identity guard — if Inngest retries and the job already completed, skip re-running
    const isAlreadyDone = await step.run(
      "Check if already completed",
      async () => {
        const record = await db
          .select({ status: STUDY_TYPE_CONTENT_TABLE.status })
          .from(STUDY_TYPE_CONTENT_TABLE)
          .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId))
          .limit(1);
        return record[0]?.status === "completed";
      },
    );

    if (isAlreadyDone) {
      console.log(
        `[Course ${courseId}] [${studyType}] Record already completed, skipping re-generation`,
      );
      return;
    }

    // Fix #4: Mark generating + clear any previous error at the start of every execution
    await step.run("Mark as generating", async () => {
      await db
        .update(STUDY_TYPE_CONTENT_TABLE)
        .set({ status: "generating", error: null })
        .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));
    });

    const courseInfo = await db
      .select({
        topic: STUDY_MATERIAL_TABLE.topic,
        courseLayout: STUDY_MATERIAL_TABLE.courseLayout,
      })
      .from(STUDY_MATERIAL_TABLE)
      .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
      .limit(1);

    const topic = courseInfo[0]?.topic || "";
    const chapters = courseInfo[0]?.courseLayout?.chapters || [];

    const chapterTitles = Array.isArray(chapters)
      ? chapters.map((ch) => ch?.chapterTitle || ch?.title).filter(Boolean)
      : [];

    const topics = Array.isArray(chapters)
      ? chapters.flatMap((ch) => {
          const t = ch?.topics || [];
          return Array.isArray(t)
            ? t
                .map((item) =>
                  typeof item === "string" ? item : item?.topicTitle,
                )
                .filter(Boolean)
            : [];
        })
      : [];

    const ragQuery = buildRAGQuery({
      courseTitle: topic,
      studyType,
      chapters,
    });

    // ─────────────────────────────────────────────────────────────────
    // UPGRADE: Semantic Cache Check (step added — existing steps unmodified)
    // Check for a semantically similar cached response BEFORE hitting Gemini.
    // On HIT: save cached content directly, skip all AI calls.
    // On MISS: fall through to RAG + generation as normal.
    // ─────────────────────────────────────────────────────────────────
    const cacheResult = await step.run("Check semantic cache", async () => {
      return await checkCache(ragQuery, studyType);
    });

    if (cacheResult.hit) {
      console.log(
        `[Course ${courseId}] [${studyType}] ⚡ Semantic cache hit — skipping Gemini call`,
      );
      await step.run("Save cached result to DB", async () => {
        await db
          .update(STUDY_TYPE_CONTENT_TABLE)
          .set({
            content: cacheResult.content,
            status: "completed",
            error: null,
          })
          .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));
      });
      return; // Done — no AI call needed
    }

    const nearHitResult = cacheResult.nearHit?.content
      ? {
          content: cacheResult.nearHit.content,
          meta: {
            fallback: true,
            type: "approximate_cache",
          },
        }
      : null;

    // ─────────────────────────────────────────────────────────────────
    // UPGRADE: RAG Context Retrieval (step added — existing steps unmodified)
    // Retrieve semantically relevant course chunks and inject into prompt.
    // Falls back to original prompt if RAG retrieval fails.
    // ─────────────────────────────────────────────────────────────────
    const enrichedPrompt = await step.run("Retrieve RAG context", async () => {
      const context = await retrieveContext(ragQuery, courseId, undefined);
      return buildRAGPrompt(prompt, context);
    });

    // Generate Study Type Content safely with fallback mechanism
    try {
      if (studyType.toLowerCase() === "flashcard") {
        AiResult = await step.run(
          "Generating Flashcards using AI",
          async () => {
            const GenerateFlashcardAiModel = createFlashcardAiModel();
            return await runAiWithFallback({
              primaryModel: GenerateFlashcardAiModel,
              modelName: MODELS.FAST,
              generationConfig: MEDIUM_REASONING_CONFIG,
              prompt: enrichedPrompt, // ← RAG-enriched prompt
              courseId,
              studyType,
              fallbackHistory: [
                {
                  role: "user",
                  parts: [
                    {
                      text: "Generate the flashcard on topic : Flutter Fundamentals,User Interface (UI) Development,Basic App Navigation in JSON format with front back content, Maximum 15",
                    },
                  ],
                },
                {
                  role: "model",
                  parts: [
                    {
                      text: '```json\n[\n  {\n    "front": "What is a Widget in Flutter?",\n    "back": "A Widget is the basic building block of a Flutter UI. Everything you see on the screen is a widget, including layout elements, text, images, and more.  They are immutable and describe the UI."\n  }\n]\n```',
                    },
                  ],
                },
              ],
            });
          },
        );
      } else if (studyType.toLowerCase() === "quiz") {
        AiResult = await step.run("Generating Quiz using AI", async () => {
          const GenerateQuizAiModel = createQuizAiModel();
          return await runAiWithFallback({
            primaryModel: GenerateQuizAiModel,
            modelName: MODELS.FAST,
            generationConfig: MEDIUM_REASONING_CONFIG,
            prompt: enrichedPrompt, // ← RAG-enriched prompt
            courseId,
            studyType,
            fallbackHistory: [
              {
                role: "user",
                parts: [
                  {
                    text: "Generate Quiz on topic : Flutter Fundamentals,User Interface (UI) Development,Basic App Navigation with Question and Options along with correct answer in JSON format",
                  },
                ],
              },
              {
                role: "model",
                parts: [
                  {
                    text: '```json\n{\n  "quizTitle": "Flutter Fundamentals, UI Development & Basic Navigation",\n  "questions": [\n    {\n      "question": "What is the fundamental building block of a Flutter UI?",\n      "options": ["Widget", "Layout", "View", "Component"],\n      "answer": "Widget"\n    }\n  ]\n}\n```',
                  },
                ],
              },
            ],
          });
        });
      } else {
        throw new Error(`Unsupported studyType: ${studyType}`);
      }
    } catch (error) {
      if (nearHitResult) {
        console.warn(
          `[Course ${courseId}] [${studyType}] Using approximate cache fallback after AI failure`,
        );
        AiResult = nearHitResult;
      } else {
        console.error(
          `[Course ${courseId}] [${studyType}] AI generation failed: ${error.message}`,
        );
        await step.run("Update DB - Failed Generation", async () => {
          await db
            .update(STUDY_TYPE_CONTENT_TABLE)
            .set({
              content: null,
              status: "failed", // Standardized status
              error: error.message,
              retryCount: sql`${STUDY_TYPE_CONTENT_TABLE.retryCount} + 1`,
            })
            .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));
        });
        return; // Terminate function after logging error
      }
    }

    const persistedResult =
      AiResult?.meta?.type === "approximate_cache"
        ? AiResult.content
        : AiResult;

    // Save the valid result
    await step.run("Save Result to DB", async () => {
      await db
        .update(STUDY_TYPE_CONTENT_TABLE)
        .set({
          content: persistedResult,
          status: "completed", // Standardized status
          error: null,
        })
        .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));
    });

    // ─────────────────────────────────────────────────────────────────
    // UPGRADE: Post-generation steps (non-blocking — failures don't affect lifecycle)
    // 1. Store result in semantic cache for future requests
    // 2. Ingest the generated content as RAG chunks for future retrievals
    // Both are fire-and-await inside step.run() so they are retried by Inngest
    // but a failure here does NOT set status to "failed" (generation already succeeded).
    // ─────────────────────────────────────────────────────────────────
    await step.run("Store result in semantic cache", async () => {
      await storeCache(ragQuery, persistedResult, studyType);
    });

    await step.run("Ingest content as RAG chunks", async () => {
      // Serialize the generated content back to text for chunking
      const contentText = JSON.stringify(persistedResult);
      await ingestChunks(courseId, contentText, studyType);
    });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// UPGRADE: Adaptive Learning — GenerateRemedialContent
// ─────────────────────────────────────────────────────────────────────────────
// Triggered by: quiz-attempt route when score < ADAPTIVE_THRESHOLD (60%)
// Event       : "adaptive.remediation"
// Event data  : { userId, courseId, percentage, weakTopics, attemptId }
//
// Follows the exact same retry + lifecycle pattern as GenerateStudyTypeContent:
//   pending → generating → completed | failed
//   - Idempotency guard on first step
//   - DB status set at start and end of execution
//   - Error captured in row, retryCount incremented on failure
// ─────────────────────────────────────────────────────────────────────────────
export const GenerateRemedialContent = inngest.createFunction(
  {
    id: "Generate Remedial Content",
    retries: 2,
    triggers: [{ event: "adaptive.remediation" }],
  },
  async ({ event, step }) => {
    const { userId, courseId, percentage, weakTopics, attemptId } = event.data;

    console.log(
      `[Adaptive] Remediation triggered — userId=${userId}, courseId=${courseId}, score=${percentage}%, topics=${JSON.stringify(weakTopics)}`,
    );

    // ── Step 1: Idempotency guard ──────────────────────────────────────────────
    // If a remedial job already exists for this attempt and is completed, skip.
    const existingJob = await step.run(
      "Check if remedial job already completed",
      async () => {
        const rows = await db
          .select({
            id: REMEDIAL_CONTENT_TABLE.id,
            status: REMEDIAL_CONTENT_TABLE.status,
          })
          .from(REMEDIAL_CONTENT_TABLE)
          .where(eq(REMEDIAL_CONTENT_TABLE.quizAttemptId, attemptId))
          .limit(1);
        return rows[0] ?? null;
      },
    );

    if (existingJob?.status === "completed") {
      console.log(
        `[Adaptive] Remedial content for attempt ${attemptId} already completed, skipping`,
      );
      return;
    }

    // ── Step 2: Create or reset remedial job row ───────────────────────────────
    let remedialId;
    if (existingJob) {
      // Retry case: reset a previously failed job
      remedialId = existingJob.id;
      await step.run("Reset failed remedial job", async () => {
        await db
          .update(REMEDIAL_CONTENT_TABLE)
          .set({ status: "generating", error: null, updatedAt: new Date() })
          .where(eq(REMEDIAL_CONTENT_TABLE.id, remedialId));
      });
    } else {
      // First run: create the job record
      remedialId = await step.run("Create remedial job record", async () => {
        const result = await db
          .insert(REMEDIAL_CONTENT_TABLE)
          .values({
            id: crypto.randomUUID(),
            userId,
            courseId: courseId ?? null,
            quizAttemptId: attemptId,
            percentage,
            weakTopics: weakTopics ?? [],
            status: "generating",
          })
          .returning({ id: REMEDIAL_CONTENT_TABLE.id });
        return result[0].id;
      });
    }

    // ── Step 3: Build remediation prompt ──────────────────────────────────────
    // Use RAG to pull relevant course context for the weak topics
    const remediationPrompt = await step.run(
      "Build RAG-enriched remediation prompt",
      async () => {
        const topicsSummary =
          Array.isArray(weakTopics) && weakTopics.length > 0
            ? weakTopics.join(", ")
            : "the recently tested concepts";

        const basePrompt =
          `The student scored ${percentage}% on their quiz and struggled with: ${topicsSummary}. ` +
          `Generate a focused remedial study plan in JSON format with the following strict schema: ` +
          `{ "remediationTitle": string, "targetTopics": string[], "studyPlan": [ { "topic": string, "explanation": string, "keyPoints": string[], "practiceQuestion": string, "answer": string } ] }. ` +
          `Generate exactly one studyPlan entry per weak topic. Be concise and actionable.`;

        // Enrich with course-specific RAG context if courseId is available
        if (courseId) {
          const context = await retrieveContext(
            basePrompt,
            courseId,
            undefined,
          );
          return buildRAGPrompt(basePrompt, context);
        }

        return basePrompt;
      },
    );

    // ── Step 4: Call Gemini for remedial content ───────────────────────────────
    let remedialResult;
    try {
      remedialResult = await step.run(
        "Generate remedial content with Gemini",
        async () => {
          // Use FAST model — remedial content is shorter than full course outlines
          const model = getModel(MODELS.FAST);
          const chat = model.startChat({
            generationConfig: {
              ...MEDIUM_REASONING_CONFIG,
              responseMimeType: "application/json",
            },
            history: [
              {
                role: "user",
                parts: [
                  {
                    text: "A student scored 40% on a Python quiz and struggled with: loops, functions. Generate a focused remedial study plan.",
                  },
                ],
              },
              {
                role: "model",
                parts: [
                  {
                    text: JSON.stringify({
                      remediationTitle: "Python Loops & Functions Remediation",
                      targetTopics: ["loops", "functions"],
                      studyPlan: [
                        {
                          topic: "loops",
                          explanation:
                            "Loops repeat a block of code. Python has for and while loops.",
                          keyPoints: [
                            "for loop iterates over sequences",
                            "while loop runs until condition is false",
                          ],
                          practiceQuestion:
                            "Write a for loop to print numbers 1-5",
                          answer: "for i in range(1, 6): print(i)",
                        },
                      ],
                    }),
                  },
                ],
              },
            ],
          });

          let rawText;
          try {
            const result = await chat.sendMessage(remediationPrompt);
            rawText = result.response.text();
          } catch (error) {
            // Apply same fallback pattern as existing workers
            if (
              geminiWithFallback.hasFallback() &&
              (error.message.includes("429") ||
                error.message.includes("Too Many Requests") ||
                error.message.includes("503") ||
                error.message.includes("Resource has been exhausted"))
            ) {
              console.log(
                `[Adaptive] Primary API overloaded, hitting fallback...`,
              );
              if (geminiWithFallback.switchToFallback()) {
                try {
                  const fallbackModel = getModel(MODELS.FAST);
                  const fallbackChat = fallbackModel.startChat({
                    generationConfig: MEDIUM_REASONING_CONFIG,
                  });
                  const fbResult =
                    await fallbackChat.sendMessage(remediationPrompt);
                  rawText = fbResult.response.text();
                  console.log(
                    `[Adaptive] ✅ Fallback API key used successfully`,
                  );
                } finally {
                  geminiWithFallback.resetToPrimary();
                }
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          }

          return parseAiJson(rawText, "Remedial content AI response");
        },
      );
    } catch (error) {
      console.error(`[Adaptive] Remedial generation failed: ${error.message}`);
      await step.run("Update DB - Remedial Failed", async () => {
        await db
          .update(REMEDIAL_CONTENT_TABLE)
          .set({
            status: "failed",
            error: error.message,
            retryCount: sql`${REMEDIAL_CONTENT_TABLE.retryCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(REMEDIAL_CONTENT_TABLE.id, remedialId));
      });
      return;
    }

    // ── Step 5: Persist remedial content as a studyTypeContent record ─────────
    // Stored as type="remedial" in STUDY_TYPE_CONTENT_TABLE so it follows
    // the same polling + lifecycle the frontend already knows how to handle.
    await step.run("Save remedial content to studyTypeContent", async () => {
      await db
        .insert(STUDY_TYPE_CONTENT_TABLE)
        .values({
          id: crypto.randomUUID(),
          courseId: courseId ?? "remedial-mixed",
          type: "remedial",
          content: remedialResult,
          status: "completed",
        })
        .onConflictDoNothing(); // safe re-entry on Inngest retry
    });

    // ── Step 6: Mark remedial job as completed ─────────────────────────────────
    await step.run("Mark remedial job completed", async () => {
      await db
        .update(REMEDIAL_CONTENT_TABLE)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(REMEDIAL_CONTENT_TABLE.id, remedialId));
    });

    console.log(
      `[Adaptive] ✅ Remedial content generated for attempt ${attemptId}`,
    );
  },
);

/**
 * Utility to execute an AI prompt with a resilient fallback mechanism
 * (UNCHANGED from original — no modifications to existing logic)
 */
async function runAiWithFallback({
  primaryModel,
  modelName,
  generationConfig,
  prompt,
  courseId,
  studyType,
  fallbackHistory,
}) {
  let finalResult;
  try {
    const result = await primaryModel.sendMessage(prompt);
    finalResult = result.response.text();
  } catch (error) {
    if (
      geminiWithFallback.hasFallback() &&
      (error.message.includes("429") ||
        error.message.includes("Too Many Requests") ||
        error.message.includes("503") ||
        error.message.includes("Resource has been exhausted"))
    ) {
      console.log(
        `[Course ${courseId}] [${studyType}] 🔄 Primary API overloaded, hitting fallback...`,
      );
      if (geminiWithFallback.switchToFallback()) {
        try {
          // Fallback fix: retry with SAME model + SAME config; only API key changes.
          const fallbackModel = getModel(modelName);
          const fallbackChat = fallbackModel.startChat({
            generationConfig,
            history: fallbackHistory,
          });

          const fbResult = await fallbackChat.sendMessage(prompt);
          finalResult = fbResult.response.text();
          console.log(
            `[Course ${courseId}] ✅ Fallback API key used successfully`,
          );
        } finally {
          geminiWithFallback.resetToPrimary();
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  try {
    return parseAiJson(finalResult, `AI ${studyType} response`);
  } catch (parseError) {
    console.error(
      `[Course ${courseId}] JSON parse failed: ${parseError.message}`,
    );
    throw new Error(`Failed to parse AI ${studyType} response`);
  }
}
