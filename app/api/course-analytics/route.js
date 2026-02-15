import { db } from "@/configs/db";
import {
  STUDY_MATERIAL_TABLE,
  STUDY_TYPE_CONTENT_TABLE,
  TOPIC_TABLE,
} from "@/configs/schema";
import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const analytics = await generateAnalytics(courseId);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error in course analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optimized function for generating analytics with minimal database calls
async function generateAnalytics(courseId) {
  try {
    // strict O(1) lookup from STUDY_MATERIAL_TABLE
    const courseResult = await db
      .select()
      .from(STUDY_MATERIAL_TABLE)
      .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
      .limit(1);

    if (!courseResult || courseResult.length === 0) {
      throw new Error("Course not found");
    }

    const course = courseResult[0];
    const totalTopics = course.totalTopics || 0;
    const completedTopics = course.completedTopics || 0;
    const progressPercentage = course.progressPercentage || 0;
    
    // Derived fields (In-Memory)
    const totalChapters = course.courseLayout?.chapters?.length || 0;
    const estimatedDuration = `${Math.round(totalTopics * 15 / 60)} hrs`;

    return {
      courseId,
      totalTopics,
      completedTopics,
      progressPercentage,
      totalChapters,
      estimatedDuration,
      courseStatus: course.status,
    };
  } catch (error) {
    console.error("Error generating analytics:", error);
    throw error;
  }
}
