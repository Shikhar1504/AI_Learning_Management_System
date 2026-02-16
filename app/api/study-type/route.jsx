import { db } from "@/configs/db";
import {
  CHAPTER_NOTES_TABLE,
  STUDY_TYPE_CONTENT_TABLE,
} from "@/configs/schema";
import { and, eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { courseId, studyType } = await req.json();

  if (!courseId) {
    return NextResponse.json([], { status: 400 });
  }

  const normalizedType = studyType?.toLowerCase();

  // =========================
  // FETCH ALL STUDY MATERIALS
  // =========================
  if (normalizedType === "all") {
    const notes = await db
      .select()
      .from(CHAPTER_NOTES_TABLE)
      .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));

    const contentList = await db
      .select()
      .from(STUDY_TYPE_CONTENT_TABLE)
      .where(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId));

    const result = {
      notes: notes || [],
      flashcard:
        contentList
          ?.filter(
            (item) =>
              item.type?.toLowerCase() === "flashcard" &&
              item.status?.toLowerCase() === "completed"
          )
          ?.flatMap((item) => item.content || []) || [],
      quiz:
        contentList
          ?.filter(
            (item) =>
              item.type?.toLowerCase() === "quiz" &&
              item.status?.toLowerCase() === "completed"
          )
          ?.flatMap((item) => item.content || []) || [],
    };

    return NextResponse.json(result);
  }

  // =========================
  // FETCH NOTES
  // =========================
  if (normalizedType === "notes") {
    const notes = await db
      .select()
      .from(CHAPTER_NOTES_TABLE)
      .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));

    return NextResponse.json(notes || []);
  }

  // =========================
  // FETCH FLASHCARD OR QUIZ
  // =========================
  const record = await db
    .select()
    .from(STUDY_TYPE_CONTENT_TABLE)
    .where(
      and(
        eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
        eq(STUDY_TYPE_CONTENT_TABLE.type, normalizedType),
        eq(STUDY_TYPE_CONTENT_TABLE.status, "completed")
      )
    )
    .orderBy(desc(STUDY_TYPE_CONTENT_TABLE.id));

  if (!record.length || !record[0].content) {
    return NextResponse.json([]);
  }

  return NextResponse.json(record[0].content);
}
