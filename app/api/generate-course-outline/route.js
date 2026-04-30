import {
  createCourseOutlineAIModel,
  getModel,
  geminiWithFallback,
  HIGH_REASONING_CONFIG,
  MODELS,
} from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, TOPIC_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";
import UserStatsService from "@/lib/userStatsService";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { COURSE_OUTLINE_PROMPT } from "@/configs/prompts";
import { z } from "zod";
import { parseAiJson } from "@/lib/parseAiJson";

const courseOutlineSchema = z.object({
  courseId: z.string().min(1),
  topic: z.string().min(1),
  courseType: z.string().min(1),
  difficultyLevel: z.string().default("Easy"),
});

/**
 * Generate a semantic fallback chapter title when the AI returns a generic label.
 * Uses part-position descriptors so titles are always topic-specific and RAG-friendly.
 *
 * Examples (topic = "Python"):
 *   index 0 → "Python Fundamentals and Core Principles"
 *   index 1 → "Core Concepts and Techniques in Python"
 *   index 2 → "Advanced Applications of Python"
 */
function _deriveFallbackChapterTitle(topic, index) {
  const PART_LABELS = [
    `${topic} Fundamentals and Core Principles`,
    `Core Concepts and Techniques in ${topic}`,
    `Advanced Applications of ${topic}`,
    `${topic} Deep Dive and Best Practices`,
    `Mastering ${topic} — Practical Skills`,
  ];
  return PART_LABELS[index] ?? `${topic} — Part ${index + 1}`;
}

function normalizeCourseLayout(layout, topic, difficultyLevel) {
  const rawChapters = Array.isArray(layout?.chapters) ? layout.chapters : [];

  const chapters = rawChapters.map((chapter, chapterIndex) => {
    const rawTitle =
      chapter?.title ||
      chapter?.chapterTitle ||
      chapter?.chapter_title ||
      "";

    // Sanitize: detect generic/placeholder titles and replace with a topic-derived
    // fallback that is still semantic and useful for embeddings + RAG retrieval.
    // Patterns caught: "Chapter 1", "Introduction", "Overview", "Getting Started",
    // "Basics", "Part 1", or a bare number.
    const GENERIC_PATTERN =
      /^(chapter\s*\d+|introduction|overview|getting\s*started|basics|part\s*\d+|\d+)$/i;
    const title =
      rawTitle && !GENERIC_PATTERN.test(rawTitle.trim())
        ? rawTitle
        : _deriveFallbackChapterTitle(topic, chapterIndex);

    const summary =
      chapter?.summary ||
      chapter?.chapterSummary ||
      chapter?.chapter_summary ||
      `This chapter covers key concepts in ${title}.`;

    const emoji = chapter?.emoji || chapter?.emoji_icon || "📘";

    const topics = Array.isArray(chapter?.topics)
      ? chapter.topics
          .map((t) => (typeof t === "string" ? t : t?.topicTitle || t?.title))
          .filter(Boolean)
      : [];

    return {
      title,
      chapterTitle: title,
      chapter_title: title,
      summary,
      chapterSummary: summary,
      chapter_summary: summary,
      emoji,
      emoji_icon: emoji,
      topics,
    };
  });

  const courseTitle =
    layout?.courseTitle || layout?.course_title || layout?.title || topic;
  const summary =
    layout?.summary || layout?.course_summary || `Course on ${topic}`;

  return {
    ...layout,
    courseTitle,
    course_title: courseTitle,
    difficulty_level: layout?.difficulty_level || difficultyLevel,
    summary,
    course_summary: summary,
    chapters,
  };
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const validation = courseOutlineSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing or invalid required fields",
        details: validation.error.format(),
      },
      { status: 400 },
    );
  }

  const { courseId, topic, courseType, difficultyLevel } = validation.data;

  const user = await currentUser();
  const createdBy = user?.primaryEmailAddress?.emailAddress;

  if (!createdBy) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // Check daily course limit before proceeding
  try {
    await UserStatsService.incrementDailyCourseCount(createdBy);
  } catch (error) {
    console.error("Daily course limit exceeded:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 429 }, // Too Many Requests
    );
  }

  const PROMPT = COURSE_OUTLINE_PROMPT(topic, courseType, difficultyLevel);

  // Create a FRESH chat session per request (avoids shared history concurrency bug)
  const courseOutlineAIModel = createCourseOutlineAIModel();

  // Generate Course Layout using AI with error handling
  let aiResult;
  try {
    const aiResp = await courseOutlineAIModel.sendMessage(PROMPT);
    try {
      aiResult = parseAiJson(
        aiResp.response.text(),
        "Course outline AI output",
      );
    } catch (parseError) {
      console.log(
        `[Course ${courseId}] JSON parse failed: ${parseError.message}`,
      );
      throw new Error("Failed to parse AI JSON response");
    }

    // Normalize key shapes from AI (course_title/chapter_title/etc) so UI + DB stay consistent.
    aiResult = normalizeCourseLayout(aiResult, topic, difficultyLevel);

    // Validate and fix chapter count
    if (aiResult.chapters && aiResult.chapters.length > 3) {
      console.log(
        `⚠️ AI generated ${aiResult.chapters.length} chapters, trimming to 3`,
      );
      aiResult.chapters = aiResult.chapters.slice(0, 3);
    } else if (aiResult.chapters && aiResult.chapters.length < 3) {
      console.log(
        `⚠️ AI generated ${aiResult.chapters.length} chapters, padding to 3`,
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

    // Ensure padded/trimmed result is also normalized.
    aiResult = normalizeCourseLayout(aiResult, topic, difficultyLevel);

    console.log(
      `✅ Course generated with ${aiResult.chapters.length} chapters`,
    );
  } catch (error) {
    console.error(`[Course ${courseId}] AI Model Error:`, error.message);

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
          // Fallback fix: retry with the SAME model/config, only API key switches.
          const fallbackModel = getModel(MODELS.SMART);

          const fallbackChat = fallbackModel.startChat({
            generationConfig: HIGH_REASONING_CONFIG,
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
          aiResult = parseAiJson(
            aiResp.response.text(),
            "Course outline AI output (fallback)",
          );
          aiResult = normalizeCourseLayout(aiResult, topic, difficultyLevel);
          console.log(
            "✅ Successfully used fallback API key for course outline",
          );
        } catch (fallbackError) {
          console.error(
            `[Course ${courseId}] Fallback API key also failed:`,
            fallbackError.message,
          );
          // Fall through to manual fallback content
        } finally {
          // Reset check
          geminiWithFallback.resetToPrimary();
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
      aiResult = normalizeCourseLayout(aiResult, topic, difficultyLevel);
    }
  }

  // Save the result along with User Input
  console.log(`[Course ${courseId}] Inserting data into the database...`);

  let dbResult;
  let courseInserted = false;
  try {
    dbResult = await db
      .insert(STUDY_MATERIAL_TABLE)
      .values({
        id: crypto.randomUUID(), // Generate unique ID
        courseId: courseId,
        courseType: courseType,
        createdBy: createdBy,
        topic: topic,
        difficultyLevel: difficultyLevel, // Add missing difficulty level
        courseLayout: aiResult,
        status: "completed", // Standardized generic status
      })
      .returning({ resp: STUDY_MATERIAL_TABLE });

    courseInserted = true;

    // Populate TOPIC_TABLE
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
      console.log(
        `[Course ${courseId}] Inserted ${topicsToInsert.length} topics into TOPIC_TABLE`,
      );

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

    console.log(`[Course ${courseId}] Database insertion successful`);
  } catch (error) {
    console.error(`[Course ${courseId}] Database insertion failed:`, error);

    if (courseInserted) {
      try {
        await db.delete(TOPIC_TABLE).where(eq(TOPIC_TABLE.courseId, courseId));
        await db
          .delete(STUDY_MATERIAL_TABLE)
          .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));
      } catch (cleanupError) {
        console.error(
          `[Course ${courseId}] Cleanup after failed insert also failed:`,
          cleanupError,
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Database insert failed" },
      { status: 500 },
    );
  }

  // Update user stats for daily activity and streak tracking
  try {
    await UserStatsService.updateUserStats(createdBy, {
      dailyActivity: true, // This triggers streak update
      courseCreated: true,
    });
    console.log("User stats updated for course creation activity");
  } catch (error) {
    console.error(
      `[Course ${courseId}] Failed to update user stats for course creation:`,
      error.message,
    );
    // Continue execution even if stats update fails
  }

  return NextResponse.json({ success: true, data: dbResult[0] });
}
