import { db } from "@/configs/db";
import { TOPIC_TABLE } from "@/configs/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { courseId } = await params;

  try {
    const topics = await db
      .select({
        id: TOPIC_TABLE.id,
        topicTitle: TOPIC_TABLE.topicTitle,
        status: TOPIC_TABLE.status,
        chapterIndex: TOPIC_TABLE.chapterIndex,
        topicIndex: TOPIC_TABLE.topicIndex,
        // user requested to NOT return notesContent
      })
      .from(TOPIC_TABLE)
      .where(eq(TOPIC_TABLE.courseId, courseId))
      .orderBy(asc(TOPIC_TABLE.chapterIndex), asc(TOPIC_TABLE.topicIndex));

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
