import {GenerateFlashcardAiModel,
  generateNotesAiModel,
  GenerateQuizAiModel,
  geminiWithFallback
} from "@/configs/AiModel";
import { db } from "@/configs/db";
import {
  STUDY_MATERIAL_TABLE,
  STUDY_TYPE_CONTENT_TABLE,
  USER_TABLE,
} from "@/configs/schema";
import { eq } from "drizzle-orm";
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

        const result = await db
          .select()
          .from(USER_TABLE)
          .where(eq(USER_TABLE.email, email));

        if (result?.length == 0) {
          //If Not, Then add to DB
          console.log("Creating new user with email:", email); // Add logging for user creation
          const userResp = await db
            .insert(USER_TABLE)
            .values({
              id: crypto.randomUUID(),
              name: user?.fullName,
              email: email,
            })
            .returning({ USER_TABLE });
          return userResp;
        }
        return result;
      }
    );
    return result?.length === 0
      ? "New user successfully created."
      : "User already exists in the database.";
  }
);



// Generate Study Type Content
export const GenerateStudyTypeContent = inngest.createFunction(
  { id: "Generate Study Type Content", retries: 1 },
  { event: "studyType.content" }, // Event trigger

  async ({ event, step }) => {
    const { studyType, prompt, courseId, recordId } = event.data;
    let AiResult = null; // Initialize AI result

    // Generate Study Type Content safely with fallback mechanism
    let usingFallback = false;

    try {
      if (studyType.toLowerCase() === "flashcard") {
        AiResult = await step.run(
          "Generating Flashcards using AI",
          async () => {
            try {
              const result = await GenerateFlashcardAiModel.sendMessage(prompt);
              return JSON.parse(result.response.text());
            } catch (error) {
              // Try fallback API key if available and error indicates overload
              if (
                !usingFallback &&
                geminiWithFallback.hasFallback() &&
                (error.message.includes("429") ||
                  error.message.includes("Too Many Requests") ||
                  error.message.includes("Resource has been exhausted"))
              ) {
                console.log(
                  "🔄 Primary API key overloaded for flashcards, trying fallback..."
                );
                if (geminiWithFallback.switchToFallback()) {
                  usingFallback = true;
                  const fallbackModel = geminiWithFallback.getGenerativeModel({
                    model: "gemini-2.5-flash",
                  });
                  const fallbackChat = fallbackModel.startChat({
                    generationConfig: {
                      temperature: 1,
                      topP: 0.95,
                      topK: 40,
                      maxOutputTokens: 8192,
                      responseMimeType: "application/json",
                    },
                    history: [
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

                  const result = await fallbackChat.sendMessage(prompt);
                  console.log(
                    "✅ Successfully used fallback API key for flashcards"
                  );
                  return JSON.parse(result.response.text());
                }
              }
              throw error; // Re-throw if fallback not available or didn't work
            }
          }
        );
      } else if (studyType.toLowerCase() === "quiz") {
        AiResult = await step.run("Generating Quiz using AI", async () => {
          try {
            const result = await GenerateQuizAiModel.sendMessage(prompt);
            return JSON.parse(result.response.text());
          } catch (error) {
            // Try fallback API key if available and error indicates overload
            if (
              !usingFallback &&
              geminiWithFallback.hasFallback() &&
              (error.message.includes("429") ||
                error.message.includes("Too Many Requests") ||
                error.message.includes("Resource has been exhausted"))
            ) {
              console.log(
                "🔄 Primary API key overloaded for quiz, trying fallback..."
              );
              if (geminiWithFallback.switchToFallback()) {
                usingFallback = true;
                const fallbackModel = geminiWithFallback.getGenerativeModel({
                  model: "gemini-2.5-flash",
                });
                const fallbackChat = fallbackModel.startChat({
                  generationConfig: {
                    temperature: 1,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                  },
                  history: [
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

                const result = await fallbackChat.sendMessage(prompt);
                console.log("✅ Successfully used fallback API key for quiz");
                return JSON.parse(result.response.text());
              }
            }
            throw error; // Re-throw if fallback not available or didn't work
          }
        });
      } else {
        throw new Error(`Unsupported studyType: ${studyType}`);
      }

      // Reset to primary API key if we were using fallback and it worked
      if (usingFallback) {
        geminiWithFallback.resetToPrimary();
        console.log("✅ Fallback API key worked, resetting to primary");
      }
    } catch (error) {
      console.error(`AI generation failed for ${studyType}`, error);
      await step.run("Update DB - Failed Generation", async () => {
        await db
          .update(STUDY_TYPE_CONTENT_TABLE)
          .set({
            content: null,
            status: "failed", // Standardized status
            error: error.message,
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
  }
);
