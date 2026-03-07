import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { and, desc, eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

// studyTypeContent (Generating New Study Materials)
// Purpose: Generates new study materials (flashcards, quizzes, etc.).
// Triggered By: MaterialCardItem when the user clicks "Generate".
// API Route Used: /api/study-type-content (from route.jsx [7]).
// Database Table Used: STUDY_TYPE_CONTENT_TABLE.
// AI Processing: Calls inngest.send() to request AI-generated content.

export async function POST(req) {
  const { chapters, courseId, type } = await req.json(); // get the data from the request

  // Normalize the type to match Inngest function expectations (always lowercase)
  const normalizedType = type?.toLowerCase();

  const PROMPT = // AI Prompt for flashcard and quiz generation
    normalizedType == "flashcard"
      ? "Generate the flashcard on topic : " +
        chapters +
        " in JSON format with front back content, Maximum 15"
      : "Generate Quiz on topic : " +
        chapters +
        " with Question and Options along with correct answer in JSON format, (Max 10)";

  // Check if a record already exists for this (courseId, type)
  const existingRecord = await db
    .select()
    .from(STUDY_TYPE_CONTENT_TABLE)
    .where(
      and(
        eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
        eq(STUDY_TYPE_CONTENT_TABLE.type, normalizedType)
      )
    )
    .orderBy(desc(STUDY_TYPE_CONTENT_TABLE.id));

  let recordId;

  if (existingRecord.length > 0) {
    const record = existingRecord[0];
    const status = record.status?.toLowerCase();

    // If already generating or completed, do not regenerate
    if (status === "generating" || status === "completed") {
      return NextResponse.json(record.id);
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

  return NextResponse.json(recordId);
}
