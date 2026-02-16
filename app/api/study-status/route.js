import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const type = searchParams.get("type");

  if (!courseId || !type) {
    return NextResponse.json(
      { error: "Missing courseId or type" },
      { status: 400 }
    );
  }

  try {
    const result = await db
      .select({
        status: STUDY_TYPE_CONTENT_TABLE.status,
      })
      .from(STUDY_TYPE_CONTENT_TABLE)
      .where(
        and(
          eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
          eq(STUDY_TYPE_CONTENT_TABLE.type, type)
        )
      )
      .orderBy(desc(STUDY_TYPE_CONTENT_TABLE.id)); // Get the latest record if duplicates exist

    if (result.length === 0) {
      // If no record found, it might mean it hasn't started generating yet, 
      // or doesn't exist. We can return "pending" or 404.
      // Returning "pending" is safer for polling logic.
      return NextResponse.json({ status: "pending" });
    }

    return NextResponse.json({ status: result[0].status?.toLowerCase() });
  } catch (error) {
    console.error("Error fetching study status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
