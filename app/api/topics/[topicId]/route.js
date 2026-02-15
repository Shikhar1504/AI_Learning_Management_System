import { NextResponse } from "next/server";
import { db } from "@/configs/db";
import { TOPIC_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";

export async function GET(request, { params }) {
  try {
    const { topicId } = await params;

    if (!topicId) {
      return NextResponse.json(
        { error: "Topic ID is required" },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        notesContent: TOPIC_TABLE.notesContent,
      })
      .from(TOPIC_TABLE)
      .where(eq(TOPIC_TABLE.id, topicId))
      .limit(1);

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      content: result[0].notesContent 
    });
  } catch (error) {
    console.error("Error fetching topic content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
