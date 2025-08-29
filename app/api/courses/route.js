import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE } from "@/configs/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Helper function to retry database operations
async function retryDbOperation(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Database operation attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

export async function POST(req) {
  try {
    const { createdBy } = await req.json();
    
    if (!createdBy) {
      return NextResponse.json({ error: "createdBy is required" }, { status: 400 });
    }
    
    const result = await retryDbOperation(async () => {
      return await db
        .select()
        .from(STUDY_MATERIAL_TABLE)
        .where(eq(STUDY_MATERIAL_TABLE.createdBy, createdBy))
        .orderBy(desc(STUDY_MATERIAL_TABLE.id));
    });
    
    return NextResponse.json({ result: result });
  } catch (error) {
    console.error("Error fetching user courses:", error);
    
    // Return empty result on database error
    return NextResponse.json({ 
      result: [],
      error: "Database temporarily unavailable",
      fallback: true
    }, { status: 200 }); // Return 200 to not break the UI
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
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const course = await retryDbOperation(async () => {
      return await db
        .select()
        .from(STUDY_MATERIAL_TABLE)
        .where(eq(STUDY_MATERIAL_TABLE?.courseId, courseId));
    });

    if (!course || course.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ result: course[0] });
  } catch (error) {
    console.error("Error fetching course:", error);
    
    // Return fallback course data
    const fallbackCourse = {
      courseId: courseId,
      courseType: "Course",
      topic: "Advanced Learning Course",
      difficultyLevel: "Intermediate",
      courseLayout: {
        courseTitle: "Course Content Loading",
        summary: "This course is temporarily unavailable due to database connectivity issues. Please try refreshing the page or check back in a few minutes.",
        chapters: [
          {
            title: "Introduction",
            summary: "Getting started with the course basics",
            topics: ["Course Overview", "Learning Objectives"]
          },
          {
            title: "Core Concepts",
            summary: "Understanding fundamental principles",
            topics: ["Key Principles", "Best Practices"]
          },
          {
            title: "Advanced Topics",
            summary: "Deep dive into complex subjects",
            topics: ["Advanced Techniques", "Case Studies"]
          }
        ]
      },
      status: "Ready",
      createdBy: "system",
      createdAt: new Date().toISOString(),
      fallback: true
    };
    
    return NextResponse.json({ 
      result: fallbackCourse,
      error: "Database temporarily unavailable",
      fallback: true
    }, { status: 200 });
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
