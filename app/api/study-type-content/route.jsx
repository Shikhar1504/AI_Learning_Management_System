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

  const PROMPT = // AI Prompt for flashcard and quiz generation
    normalizedType === "flashcard"
      ? FLASHCARD_PROMPT(chapters)
      : QUIZ_PROMPT(chapters);

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
