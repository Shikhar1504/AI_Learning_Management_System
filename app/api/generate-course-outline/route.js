import { courseOutlineAIModel, geminiWithFallback } from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, TOPIC_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";
import UserStatsService from "@/lib/userStatsService";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { courseId, topic, courseType, difficultyLevel, createdBy } =
    await req.json();

  // Check daily course limit before proceeding
  try {
    await UserStatsService.incrementDailyCourseCount(createdBy);
  } catch (error) {
    console.error("Daily course limit exceeded:", error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 429 } // Too Many Requests
    );
  }

  const PROMPT =
    "Generate a study material for " +
    topic +
    " for " +
    courseType +
    " and level of difficulty  will be " +
    difficultyLevel +
    " with summary of course, List of Chapters (EXACTLY 3 chapters, no more, no less) along with summary and Emoji icon for each chapter, Topic list in each chapter, and all result in JSON format. IMPORTANT: Generate exactly 3 chapters only.";

  // Generate Course Layout using AI with error handling
  let aiResult;
  try {
    const aiResp = await courseOutlineAIModel.sendMessage(PROMPT);
    aiResult = JSON.parse(aiResp.response.text());

    // Validate and fix chapter count
    if (aiResult.chapters && aiResult.chapters.length > 3) {
      console.log(
        `⚠️ AI generated ${aiResult.chapters.length} chapters, trimming to 3`
      );
      aiResult.chapters = aiResult.chapters.slice(0, 3);
    } else if (aiResult.chapters && aiResult.chapters.length < 3) {
      console.log(
        `⚠️ AI generated ${aiResult.chapters.length} chapters, padding to 3`
      );
      // Add generic chapters if needed
      while (aiResult.chapters.length < 3) {
        const chapterNum = aiResult.chapters.length + 1;
        aiResult.chapters.push({
          title: `${topic} - Part ${chapterNum}`,
          emoji: "📖",
          summary: `Additional concepts and topics for ${topic}`,
          topics: [
            "Advanced concepts",
            "Practical applications",
            "Best practices",
          ],
        });
      }
    }

    console.log(
      `✅ Course generated with ${aiResult.chapters.length} chapters`
    );
  } catch (error) {
    console.error("AI Model Error:", error.message);

    // Try fallback API key if available
    if (
      geminiWithFallback.hasFallback() &&
      (error.message.includes("429") ||
        error.message.includes("Too Many Requests") ||
        error.message.includes("503") ||
        error.message.includes("Resource has been exhausted"))
    ) {
      console.log("🔄 Primary API key overloaded, trying fallback...");
      if (geminiWithFallback.switchToFallback()) {
        try {
          // Re-create the model configuration for fallback
          const fallbackModel = geminiWithFallback.getGenerativeModel({
            model: "gemini-2.5-flash",
          });
          
          const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          };

          const fallbackChat = fallbackModel.startChat({
            generationConfig,
            history: [
              {
                role: "user",
                parts: [
                  {
                    text: "Generate a study material for Python for  Exam and level of difficulty will be EASY with summery of course,List of Chapters along with summery for each chapter, Topic list in each chapter, All resule in JSON format\n\n",
                  },
                ],
              },
              {
                role: "model",
                parts: [
                  {
                    text: '```json\n{\n  "course_title": "Python for Beginners",\n  "difficulty": "Easy",\n  "summary": "This course provides an introduction to the Python programming language...",\n  "chapters": []\n}\n```',
                  },
                ],
              },
            ],
          });

          const aiResp = await fallbackChat.sendMessage(PROMPT);
          aiResult = JSON.parse(aiResp.response.text());
          console.log("✅ Successfully used fallback API key for course outline");
          
          // Reset check 
          geminiWithFallback.resetToPrimary();
        } catch (fallbackError) {
           console.error("❌ Fallback API key also failed:", fallbackError.message);
           // Fall through to manual fallback content
        }
      }
    }

    // Only use manual fallback if aiResult is still undefined
    if (!aiResult) {
      console.log("⚠️ Using manual fallback content");
      aiResult = {
        courseTitle: topic,
        summary: `A comprehensive course on ${topic} for ${difficultyLevel} level students.`,
        chapters: [
          {
            title: "Introduction to " + topic,
            emoji: "📚",
            summary: "Basic concepts and fundamentals of " + topic,
            topics: ["Overview", "Core concepts", "Getting started"],
          },
          {
            title: "Intermediate " + topic,
            emoji: "🔍",
            summary: "Deeper exploration of " + topic + " concepts",
            topics: ["Advanced techniques", "Best practices", "Case studies"],
          },
          {
            title: "Mastering " + topic,
            emoji: "🚀",
            summary: "Expert-level knowledge and applications",
            topics: [
              "Professional applications",
              "Future trends",
              "Final project",
            ],
          },
        ],
      };
    }
  }

  // Save the result along with User Input
  console.log("Inserting data into the database...");
  const dbResult = await db
    .insert(STUDY_MATERIAL_TABLE)
    .values({
      id: crypto.randomUUID(), // Generate unique ID
      courseId: courseId,
      courseType: courseType,
      createdBy: createdBy,
      topic: topic,
      difficultyLevel: difficultyLevel, // Add missing difficulty level
      courseLayout: aiResult,
      status: "Ready", // Notes are now generated on-demand, so course is ready immediately
    })
    .returning({ resp: STUDY_MATERIAL_TABLE });
  console.log("Database insertion successful:", dbResult);

  // Update user stats for daily activity and streak tracking
  try {
    await UserStatsService.updateUserStats(createdBy, {
      dailyActivity: true, // This triggers streak update
      courseCreated: true,
    });
    console.log("User stats updated for course creation activity");
  } catch (error) {
    console.error(
      "Failed to update user stats for course creation:",
      error.message
    );
    // Continue execution even if stats update fails
  }

  // Populate TOPIC_TABLE
  try {
    const chapters = aiResult?.chapters || [];
    const topicsToInsert = [];

    chapters.forEach((chapter, chapterIndex) => {
      if (chapter.topics && Array.isArray(chapter.topics)) {
        chapter.topics.forEach((topic, topicIndex) => {
          topicsToInsert.push({
            id: crypto.randomUUID(),
            courseId: courseId,
            chapterIndex: chapterIndex,
            topicIndex: topicIndex,
            chapterTitle: chapter.title || `Chapter ${chapterIndex + 1}`, // Fallback for safety
            topicTitle: topic,
            status: "pending",
            notesContent: null,
          });
        });
      }
    });

    if (topicsToInsert.length > 0) {
      await db.insert(TOPIC_TABLE).values(topicsToInsert);
      console.log(`Inserted ${topicsToInsert.length} topics into TOPIC_TABLE`);

      // Initialize STUDY_MATERIAL_TABLE progress fields
      await db
        .update(STUDY_MATERIAL_TABLE)
        .set({
          totalTopics: topicsToInsert.length,
          completedTopics: 0,
          progressPercentage: 0,
        })
        .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));
    }
  } catch (error) {
    console.error("Error populating TOPIC_TABLE:", error);
    // Log error but don't fail the request as course is created
  }


  return NextResponse.json({ result: dbResult[0] });
}
