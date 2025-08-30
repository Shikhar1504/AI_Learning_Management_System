import { courseOutlineAIModel } from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";
import UserStatsService from "@/lib/userStatsService";
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

  {
    /*It extracts the request body fields:
  courseId → Unique ID for the course
  topic → The topic of the study material (e.g., "React Development")
  courseType → Type of course (e.g., "Programming")
  difficultyLevel → How difficult the course should be (e.g., "Intermediate")
  createdBy → The email of the user who created the course*/
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

    // Fallback content when AI fails
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
      status: "Generating", // Add status field
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

  //Trigger the Inngest function to generate chapter notes
  try {
    await inngest.send({
      name: "notes.generate",
      data: {
        course: dbResult[0].resp,
      },
    });
    console.log("Inngest event sent successfully");
  } catch (error) {
    console.error("Inngest API Error:", error.message);
    // Continue execution even if Inngest fails
  }

  return NextResponse.json({ result: dbResult[0] });
}
