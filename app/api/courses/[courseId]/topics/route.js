import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, TOPIC_TABLE } from "@/configs/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { courseId } = await params;

  try {
    const topics = await db
      .select({
        id: TOPIC_TABLE.id,
        topicTitle: TOPIC_TABLE.topicTitle,
        chapterTitle: TOPIC_TABLE.chapterTitle,
        status: TOPIC_TABLE.status,
        chapterIndex: TOPIC_TABLE.chapterIndex,
        topicIndex: TOPIC_TABLE.topicIndex,
        // user requested to NOT return notesContent
      })
      .from(TOPIC_TABLE)
      .where(eq(TOPIC_TABLE.courseId, courseId))
      .orderBy(asc(TOPIC_TABLE.chapterIndex), asc(TOPIC_TABLE.topicIndex));

    // Read-time repair for legacy rows where chapterTitle was stored as "Chapter N".
    const hasGenericTitles = topics.some(
      (t) =>
        !t.chapterTitle ||
        /^Chapter\s+\d+$/i.test(String(t.chapterTitle).trim()),
    );

    if (hasGenericTitles) {
      const course = await db
        .select({ courseLayout: STUDY_MATERIAL_TABLE.courseLayout })
        .from(STUDY_MATERIAL_TABLE)
        .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
        .limit(1);

      const chapters = course?.[0]?.courseLayout?.chapters || [];

      for (const topic of topics) {
        if (
          !topic.chapterTitle ||
          /^Chapter\s+\d+$/i.test(String(topic.chapterTitle).trim())
        ) {
          const chapter = chapters[topic.chapterIndex] || {};
          topic.chapterTitle =
            chapter.title ||
            chapter.chapterTitle ||
            chapter.chapter_title ||
            topic.chapterTitle;
        }
      }
    }

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 },
    );
  }
}
