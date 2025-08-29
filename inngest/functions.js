import {
  generateNotesAiModel,
  GenerateQuizAiModel,
  GenerateFlashcardAiModel,
} from "@/configs/AiModel";
import { inngest } from "./client";
import { db } from "@/configs/db";
import {
  CHAPTER_NOTES_TABLE,
  STUDY_MATERIAL_TABLE,
  STUDY_TYPE_CONTENT_TABLE,
  USER_TABLE,
} from "@/configs/schema";
import { eq } from "drizzle-orm";

// Helper function to generate fallback content when AI API fails
function generateFallbackContent(chapter, courseType) {
  const { title, topics, summary } = chapter;
  
  // Create basic HTML content based on chapter information
  let content = `
    <div class="chapter-content">
      <h1>${title}</h1>
      <p class="summary"><strong>Summary:</strong> ${summary}</p>
      <div class="topics">
  `;
  
  // Add content for each topic
  topics.forEach(topic => {
    content += `
      <div class="topic">
        <h2>${topic}</h2>
        <p>This section covers key concepts related to ${topic} in the context of ${title}.</p>
        <div class="key-points">
          <h3>Key Points:</h3>
          <ul>
            <li>Understanding the fundamentals of ${topic}</li>
            <li>How ${topic} relates to ${title}</li>
            <li>Practical applications of ${topic}</li>
          </ul>
        </div>
    `;
    
    // Add example code if it might be a technical topic
    if (title.toLowerCase().includes("programming") || 
        title.toLowerCase().includes("code") || 
        title.toLowerCase().includes("development") ||
        title.toLowerCase().includes("machine learning") ||
        topic.toLowerCase().includes("code") ||
        topic.toLowerCase().includes("algorithm")) {
      content += `
        <div class="code-example">
          <h3>Example:</h3>
          <precode>
          // Example code for ${topic}
          function example${topic.replace(/\s+/g, '')}() {
            console.log("This is a placeholder for ${topic} code example");
            // Implementation would go here
            return "Example result";
          }
          </precode>
        </div>
      `;
    }
    
    content += `
      </div>
    `;
  });
  
  content += `
      </div>
    </div>
  `;
  
  return content;
}

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

export const GenerateNotes = inngest.createFunction(
  { id: "generate-course", retries: 1 }, // Define function ID and retry attempts
  { event: "notes.generate" }, // Define the event that triggers this function
  async ({ event, step }) => {
    const { course } = event.data; // Extract course information from the event data

    // Step 1: Generate Notes for Each Chapter using AI
    const notesResult = await step.run("Generate Chapter Notes", async () => {
      const Chapters = course?.courseLayout?.chapters; // Get the chapters from the course layout
      let index = 0;

      // Loop through each chapter to generate notes using AI
      for (const chapter of Chapters) {
        // Construct the AI prompt dynamically based on the course and chapter content
        const PROMPT =
          "Generate " +
          course?.courseType +
          " material detail content for each chapter. " +
          "Make sure to give notes for each topic from the chapters, " +
          "include code examples if applicable inside <precode> tags, " +
          "highlight key points, and style each tag appropriately. " +
          "Provide the response in HTML format (Do not include <html>, <head>, <body>, or <title> tags). " +
          "The chapter content is: " +
          JSON.stringify(chapter);

        console.log(PROMPT); // Log the prompt for debugging
        
        // Add retry logic with exponential backoff
        let retries = 0;
        const maxRetries = 3;
        let aiResp = "";
        
        while (retries <= maxRetries) {
          try {
            // Call the AI model to generate notes
            const result = await generateNotesAiModel.sendMessage(PROMPT);
            aiResp = result.response.text(); // Extract AI-generated text response
            break; // Success, exit the retry loop
          } catch (error) {
            console.error(`AI API Error (attempt ${retries + 1}/${maxRetries + 1}):`, error.message);
            
            if (retries === maxRetries) {
              // Generate fallback content on final retry
              console.log("Generating fallback content for chapter:", chapter.title);
              aiResp = generateFallbackContent(chapter, course?.courseType);
              break;
            }
            
            // Check if it's a rate limit error (429)
            if (error.message.includes("429") || error.message.includes("Too Many Requests")) {
              const delaySeconds = Math.pow(2, retries) * 30; // Exponential backoff: 30s, 60s, 120s
              console.log(`Rate limit hit. Waiting ${delaySeconds} seconds before retry...`);
              await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
            } else if (error.message.includes("503") || error.message.includes("500")) {
              // For server errors, wait a bit less
              const delaySeconds = Math.pow(1.5, retries) * 20; 
              console.log(`Server error. Waiting ${delaySeconds} seconds before retry...`);
              await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
            } else {
              // For other errors, use fallback content
              console.log("Unrecoverable error, using fallback content");
              aiResp = generateFallbackContent(chapter, course?.courseType);
              break;
            }
          }
          retries++;
          
          // Add delay between chapters to avoid rate limits
          if (retries <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second pause between retries
          }
        }

        // Store the generated notes in the database
        await db.insert(CHAPTER_NOTES_TABLE).values({
          chapterId: index, // Assign an index to the chapter
          courseId: course?.courseId, // Link notes to the corresponding course
          notes: aiResp, // Store the AI-generated notes
        });

        // Add delay between chapters to avoid rate limits
        if (index < Chapters.length - 1) {
          console.log("Waiting 10 seconds before processing next chapter to avoid rate limits...");
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second pause between chapters
        }

        index = index + 1; // Increment index for the next chapter
      }
      return Chapters; // Return processed chapters
    });

    // Step 2: Update Course Status to 'Ready' after generating notes
    const updateCourseStatusResult = await step.run(
      "Update Course Status to Ready",
      async () => {
        const result = await db
          .update(STUDY_MATERIAL_TABLE)
          .set({ status: "Ready" }) // Mark the course as ready
          .where(eq(STUDY_MATERIAL_TABLE.courseId, course?.courseId)); // Match the course ID

        return "Success"; // Indicate successful status update
      }
    );
  }
);

// Generate Study Type Content
export const GenerateStudyTypeContent = inngest.createFunction(
  { id: "Generate Study Type Content", retries: 1 },
  { event: "studyType.content" }, // Event trigger

  async ({ event, step }) => {
    const { studyType, prompt, courseId, recordId } = event.data;
    let AiResult = null; // Initialize AI result

    // Generate Study Type Content safely
    try {
      if (studyType === "Flashcard") {
        AiResult = await step.run(
            "Generating Flashcards using AI",
            async () => {
            const result = await GenerateFlashcardAiModel.sendMessage(prompt);
            return JSON.parse(result.response.text());
          }
        );
      } else if (studyType === "Quiz") {
        AiResult = await step.run(
            "Generating Quiz using AI", 
            async () => {
            const result = await GenerateQuizAiModel.sendMessage(prompt);
            return JSON.parse(result.response.text());
          }
        );
      } else {
        throw new Error(`Unsupported studyType: ${studyType}`);
      }
    } catch (error) {
      console.error(`AI generation failed for ${studyType}`, error);
      await step.run("Update DB - Failed Generation", async () => {
        await db
          .update(STUDY_TYPE_CONTENT_TABLE)
          .set({
            content: null,
            status: "Failed",
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
          status: "Ready",
          error: null,
        })
        .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));
    });
  }
);

export const HandleRiseAppEvent = inngest.createFunction(
  { id: "handle-rise-app-event" },
  { event: "rise-app" },
  async ({ event, step }) => {
    console.log("Received rise-app event:", event.data);
    return "Rise-app event handled successfully.";
  }
);
