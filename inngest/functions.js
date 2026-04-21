import {
  createFlashcardAiModel,
  createQuizAiModel,
  geminiWithFallback,
  getModel,
  MEDIUM_REASONING_CONFIG,
  MODELS,
} from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE, USER_TABLE } from "@/configs/schema";
import { eq, sql } from "drizzle-orm";
import { inngest } from "./client";

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
  { id: "create-user", retries: 1 },
  { event: "user.create" },
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
  { id: "Generate Study Type Content", retries: 1 },
  { event: "studyType.content" }, // Event trigger

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
              prompt,
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
            prompt,
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

    // Save the valid result
    await step.run("Save Result to DB", async () => {
      await db
        .update(STUDY_TYPE_CONTENT_TABLE)
        .set({
          content: AiResult,
          status: "completed", // Standardized status
          error: null,
        })
        .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));
    });
  },
);

/**
 * Utility to execute an AI prompt with a resilient fallback mechanism
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
    return JSON.parse(finalResult);
  } catch (parseError) {
    console.error(
      `[Course ${courseId}] JSON parse failed: ${parseError.message}`,
    );
    throw new Error(`Failed to parse AI ${studyType} response`);
  }
}
