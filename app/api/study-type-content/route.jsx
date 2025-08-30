import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
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

  // Normalize the type to match Inngest function expectations
  const normalizedType =
    type === "flashcard" ? "Flashcard" : type === "quiz" ? "Quiz" : type;

  const PROMPT = // AI Prompt for flashcard and quiz generation
    normalizedType == "Flashcard"
      ? "Generate the flashcard on topic : " +
        chapters +
        " in JSON format with front back content, Maximum 15"
      : "Generate Quiz on topic : " +
        chapters +
        " with Question and Options along with correct answer in JSON format, (Max 10)";

  //Insert Record to DB , Update status to Generating...
  const result = await db
    .insert(STUDY_TYPE_CONTENT_TABLE)
    .values({
      id: crypto.randomUUID(), // Generate unique ID
      courseId: courseId,
      type: normalizedType, // Use normalized type
      status: "Generating", // Explicitly set status
    })
    .returning({ id: STUDY_TYPE_CONTENT_TABLE.id });

  //Trigger Inngest Function to Generate Content
  const result_ = await inngest.send({
    name: "studyType.content",
    data: {
      studyType: normalizedType, // Use normalized type
      prompt: PROMPT,
      courseId: courseId,
      recordId: result[0].id,
    },
  });

  return NextResponse.json(result[0].id);
}
