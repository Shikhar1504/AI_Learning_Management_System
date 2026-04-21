import { db } from "@/configs/db";
import {
  STUDY_MATERIAL_TABLE,
  STUDY_TYPE_CONTENT_TABLE,
  TOPIC_TABLE,
} from "@/configs/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

// Helper function to retry database operations
async function retryDbOperation(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(
        `Database operation attempt ${attempt}/${maxRetries} failed:`,
        error.message,
      );

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
}

export async function POST(req) {
  try {
    const user = await currentUser();
    const createdBy = user?.primaryEmailAddress?.emailAddress;

    if (!createdBy) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const result = await retryDbOperation(async () => {
      return await db
        .select()
        .from(STUDY_MATERIAL_TABLE)
        .where(eq(STUDY_MATERIAL_TABLE.createdBy, createdBy))
        .orderBy(desc(STUDY_MATERIAL_TABLE.id));
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching user courses:", error);

    // Return empty result on database error
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: "Database temporarily unavailable",
        fallback: true,
      },
      { status: 200 },
    ); // Return 200 to not break the UI
  }
}

{
  /* Purpose:
Retrieves all study materials created by a specific user (createdBy).
Orders them by id in descending order (newest first).
Returns the result as a JSON response.

How it Works:
Extracts createdBy from the request body (req.json()).
Queries the database (STUDY_MATERIAL_TABLE) to find records where createdBy matches.
Sorts results in descending order by id.
Sends the results as a JSON response. */
}

export async function GET(req) {
  const reqUrl = req.url;
  const { searchParams } = new URL(reqUrl);
  const courseId = searchParams?.get("courseId");

  try {
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "courseId is required" },
        { status: 400 },
      );
    }

    const course = await retryDbOperation(async () => {
      return await db
        .select()
        .from(STUDY_MATERIAL_TABLE)
        .where(eq(STUDY_MATERIAL_TABLE?.courseId, courseId));
    });

    if (!course || course.length === 0) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: course[0] });
  } catch (error) {
    console.error(`[Course ${courseId}] Error fetching course:`, error);
    // Return a real error — never ship fake course data to the UI
    return NextResponse.json(
      {
        success: false,
        error: "Database temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams?.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "courseId is required" },
        { status: 400 },
      );
    }

    await db
      .delete(STUDY_TYPE_CONTENT_TABLE)
      .where(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId));

    await db.delete(TOPIC_TABLE).where(eq(TOPIC_TABLE.courseId, courseId));

    await db
      .delete(STUDY_MATERIAL_TABLE)
      .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

    console.log(
      `✅ Course ${courseId} and all related content deleted successfully`,
    );

    return NextResponse.json({
      success: true,
      data: {
        message: "Course and all related content deleted successfully",
        courseId,
      },
    });
  } catch (error) {
    console.error(`[Course ${courseId}] Error deleting course:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete course",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

{
  /*Purpose:
Retrieves a single study material by courseId.
Returns the first matching record.

How it Works:
Extracts the courseId from the query string (searchParams.get("courseId")).
Queries the database (STUDY_MATERIAL_TABLE) to find records where courseId matches.
Returns the first matching result as JSON. */
}
