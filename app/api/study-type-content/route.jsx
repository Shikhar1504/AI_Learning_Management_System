import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { and, desc, eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";
import { FLASHCARD_PROMPT, QUIZ_PROMPT } from "@/configs/prompts";

// studyTypeContent (Generating New Study Materials)
// Purpose: Generates new study materials (flashcards, quizzes, etc.).
// Triggered By: MaterialCardItem when the user clicks "Generate".
// API Route Used: /api/study-type-content (from route.jsx [7]).
// Database Table Used: STUDY_TYPE_CONTENT_TABLE.
// AI Processing: Calls inngest.send() to request AI-generated content.

export async function POST(req) {
  const { chapters, courseId, type } = await req.json(); // get the data from the request

  // Normalize BEFORE validation so checks operate on clean value
  const normalizedType = type?.toLowerCase();

  if (!courseId || !normalizedType || !chapters) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 },
    );
  }

  // Only allow supported study types
  const ALLOWED_TYPES = ["flashcard", "quiz"];
  if (!ALLOWED_TYPES.includes(normalizedType)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Flatten chapters into a clean list of granular topic strings.
  // The AI prompt expects specific topics (e.g. "Primitive Data Types"),
  // NOT chapter titles (e.g. "Java Fundamentals and Syntax").
  console.log("[StudyType] Raw chapters type:", typeof chapters, "| isArray:", Array.isArray(chapters));

  let topics = [];

  if (Array.isArray(chapters)) {
    // Preferred path: frontend sends full chapter objects with nested topics
    topics = chapters.flatMap((ch) => ch?.topics || []);
  } else {
    // Fallback: frontend sends a string (legacy/cached). Fetch topics from DB.
    console.log("[StudyType] chapters is not an array — fetching topics from DB for courseId:", courseId);
    try {
      const { STUDY_MATERIAL_TABLE } = await import("@/configs/schema");
      const courseInfo = await db
        .select({ courseLayout: STUDY_MATERIAL_TABLE.courseLayout })
        .from(STUDY_MATERIAL_TABLE)
        .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
        .limit(1);

      const dbChapters = courseInfo[0]?.courseLayout?.chapters || [];
      topics = dbChapters.flatMap((ch) => {
        const t = ch?.topics || [];
        return Array.isArray(t)
          ? t.map((item) => (typeof item === "string" ? item : item?.topicTitle)).filter(Boolean)
          : [];
      });
    } catch (e) {
      console.warn("[StudyType] DB fallback failed:", e.message);
    }
  }

  topics = topics
    .filter(Boolean)
    .map((t) => String(t).trim())
    .filter((t) => t.length > 0);

  console.log("[StudyType] Extracted topics:", topics);

  if (topics.length === 0) {
    return NextResponse.json(
      { success: false, error: "Topic extraction failed — no topics found for this course" },
      { status: 400 },
    );
  }

  const PROMPT =
    normalizedType === "flashcard"
      ? FLASHCARD_PROMPT(topics.join(", "))
      : QUIZ_PROMPT(topics.join(", "));

  // Check if a record already exists for this (courseId, type)
  const existingRecord = await db
    .select()
    .from(STUDY_TYPE_CONTENT_TABLE)
    .where(
      and(
        eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
        eq(STUDY_TYPE_CONTENT_TABLE.type, normalizedType),
      ),
    )
    .orderBy(desc(STUDY_TYPE_CONTENT_TABLE.id));

  let recordId;

  if (existingRecord.length > 0) {
    const record = existingRecord[0];
    const status = record.status?.toLowerCase();

    // Return early WITHOUT firing Inngest - no duplicate job for active/done records
    if (status === "generating" || status === "completed") {
      return NextResponse.json({ success: true, data: record.id });
    }

    // If failed, we retry by updating the existing record
    if (status === "failed") {
      await db
        .update(STUDY_TYPE_CONTENT_TABLE)
        .set({ status: "generating", error: null })
        .where(eq(STUDY_TYPE_CONTENT_TABLE.id, record.id));

      recordId = record.id;
    }
  }

  // If no record exists (or we're not retrying an existing one), create a new one
  if (!recordId) {
    try {
      const result = await db
        .insert(STUDY_TYPE_CONTENT_TABLE)
        .values({
          id: crypto.randomUUID(),
          courseId: courseId,
          type: normalizedType,
          status: "generating",
        })
        .returning({ id: STUDY_TYPE_CONTENT_TABLE.id });

      recordId = result[0].id;
    } catch (error) {
      if (
        error.code === "23505" ||
        error.message.includes("unique constraint")
      ) {
        console.log(
          `[Course ${courseId}] Duplicate insert caught for ${normalizedType}, retrieving existing record`,
        );
        const existing = await db
          .select()
          .from(STUDY_TYPE_CONTENT_TABLE)
          .where(
            and(
              eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
              eq(STUDY_TYPE_CONTENT_TABLE.type, normalizedType),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          recordId = existing[0].id;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  //Trigger Inngest Function to Generate Content
  await inngest.send({
    name: "studyType.content",
    data: {
      studyType: normalizedType,
      prompt: PROMPT,
      courseId: courseId,
      recordId: recordId,
    },
  });

  return NextResponse.json({ success: true, data: recordId });
}
