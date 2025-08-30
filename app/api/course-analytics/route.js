import { db } from "@/configs/db";
import {
  CHAPTER_NOTES_TABLE,
  STUDY_MATERIAL_TABLE,
  STUDY_TYPE_CONTENT_TABLE,
} from "@/configs/schema";
import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Enhanced in-memory cache with better TTL management
const analyticsCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // Reduced to 3 minutes for fresher data
const SHORT_CACHE_TTL = 30 * 1000; // 30 seconds for fallback data

// Cache helper functions
function getCachedAnalytics(courseId) {
  const cached = analyticsCache.get(courseId);
  if (
    cached &&
    Date.now() - cached.timestamp <
      (cached.isFallback ? SHORT_CACHE_TTL : CACHE_TTL)
  ) {
    return cached.data;
  }
  return null;
}

function setCachedAnalytics(courseId, data, isFallback = false) {
  analyticsCache.set(courseId, {
    data,
    timestamp: Date.now(),
    isFallback,
  });

  // Clean up old entries more aggressively
  if (analyticsCache.size > 50) {
    const now = Date.now();
    for (const [key, value] of analyticsCache.entries()) {
      const ttl = value.isFallback ? SHORT_CACHE_TTL : CACHE_TTL;
      if (now - value.timestamp > ttl) {
        analyticsCache.delete(key);
      }
    }
  }
}

// Helper function with more aggressive retry and timeout settings
async function retryDbOperation(operation, maxRetries = 0, delay = 100) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(
        `Analytics DB operation attempt ${attempt + 1}/${
          maxRetries + 1
        } failed:`,
        error.message
      );

      if (attempt === maxRetries) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, delay * (attempt + 1))
      );
    }
  }
}

// Ultra-fast fallback analytics with minimal processing
function getUltraFastFallbackAnalytics(courseId, course = null) {
  const totalChapters = course?.courseLayout?.chapters?.length || 3;

  return {
    courseId,
    totalChapters,
    completedChapters: 0,
    progressPercentage: 0,
    estimatedDuration: "Calculating...",
    rating: 0,
    lastStudyTime: "Not started",
    materialCounts: {
      flashcard: 0,
      quiz: 0,
      notes: 0,
    },
    courseStatus: course?.status || "Loading",
    createdAt: course?.createdAt || new Date().toISOString(),
    difficulty: course?.difficultyLevel || "Intermediate",
    hasFlashcards: false,
    hasQuiz: false,
    hasNotes: false,
    fallback: true,
    ultraFast: true,
  };
}

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

    // Check cache first
    const cachedResult = getCachedAnalytics(courseId);
    if (cachedResult) {
      console.log("📊 Serving cached analytics for course:", courseId);
      return NextResponse.json(cachedResult);
    }

    // Ultra-fast timeout for better user experience (reduced to 5 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(new Error("Analytics timeout - using ultra-fast fallback")),
        5000
      );
    });

    try {
      const analyticsPromise = generateAnalytics(courseId);
      const analytics = await Promise.race([analyticsPromise, timeoutPromise]);

      // Cache the successful result
      setCachedAnalytics(courseId, analytics, false);

      return NextResponse.json(analytics);
    } catch (error) {
      console.warn(
        `Analytics generation timed out: ${error.message}, using ultra-fast fallback`
      );

      // Try to get basic course info for fallback with ultra-fast timeout
      let course = null;
      try {
        const quickCourseQuery = await Promise.race([
          db
            .select()
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
            .limit(1),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Quick query timeout")), 200)
          ),
        ]);
        course = quickCourseQuery[0] || null;
      } catch (quickError) {
        console.warn("Ultra-fast course query failed, using minimal fallback");
      }

      const fallbackData = getUltraFastFallbackAnalytics(courseId, course);

      // Cache fallback data for a very short time
      setCachedAnalytics(courseId, fallbackData, true);

      return NextResponse.json(fallbackData);
    }
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
  console.log("🔍 Generating fresh analytics for course:", courseId);
  const startTime = Date.now();

  // Single optimized query to get all necessary data
  const courseResult = await retryDbOperation(
    async () => {
      return await db
        .select()
        .from(STUDY_MATERIAL_TABLE)
        .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
        .limit(1);
    },
    0,
    100
  ); // No retries for faster failure

  if (courseResult.length === 0) {
    throw new Error("Course not found");
  }

  const course = courseResult[0];
  const chapters = course.courseLayout?.chapters || [];
  const totalChapters = chapters.length;

  // Single optimized query for all study materials with minimal timeout
  const studyDataPromise = Promise.race([
    retryDbOperation(
      async () => {
        const [completedChaptersResult, materialCountsResult] =
          await Promise.all([
            db
              .select({ count: count() })
              .from(CHAPTER_NOTES_TABLE)
              .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId)),
            db
              .select({
                type: STUDY_TYPE_CONTENT_TABLE.type,
                count: count(),
              })
              .from(STUDY_TYPE_CONTENT_TABLE)
              .where(
                and(
                  eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
                  eq(STUDY_TYPE_CONTENT_TABLE.status, "Ready")
                )
              )
              .groupBy(STUDY_TYPE_CONTENT_TABLE.type),
          ]);

        return {
          completedChapters: completedChaptersResult[0]?.count || 0,
          materialCounts: materialCountsResult,
        };
      },
      0,
      100
    ), // No retries for faster failure
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Study data query timeout")), 5000)
    ), // Ultra-fast timeout
  ]);

  let completedChapters = 0;
  let materialCountsRaw = [];

  try {
    const studyData = await studyDataPromise;
    completedChapters = studyData.completedChapters;
    materialCountsRaw = studyData.materialCounts;
  } catch (studyError) {
    console.warn(
      "Study data query failed, using zero values:",
      studyError.message
    );
    // Continue with zero values
  }

  // Calculate progress percentage
  const progressPercentage =
    totalChapters > 0
      ? Math.round((completedChapters / totalChapters) * 100)
      : 0;

  // Process study material counts
  const materialCounts = {
    flashcard: 0,
    quiz: 0,
    notes: completedChapters,
  };

  materialCountsRaw.forEach((item) => {
    const type = item.type?.toLowerCase();
    if (type && materialCounts.hasOwnProperty(type)) {
      materialCounts[type] = item.count || 0;
    }
  });

  // Ultra-fast estimated duration calculation
  const estimateContentDuration = () => {
    if (totalChapters === 0) return "N/A";

    let totalMinutes = totalChapters * 20; // Reduced estimate
    totalMinutes += materialCounts.flashcard * 0.5; // Reduced time per flashcard
    totalMinutes += materialCounts.quiz * 1; // Reduced time per quiz question

    const hours = totalMinutes / 60;

    if (hours < 0.5) {
      return `${Math.round(totalMinutes)} min`;
    } else if (hours < 1) {
      return "1 hour";
    } else {
      return `${Math.round(hours)} hrs`;
    }
  };

  // Simple rating calculation
  const generateRating = () => {
    if (progressPercentage >= 100) return 5.0;
    if (progressPercentage > 75) return 4.7;
    if (progressPercentage > 50) return 4.3;
    if (progressPercentage > 25) return 4.0;
    if (progressPercentage > 0) return 3.5;
    return 4.2; // Default for not started
  };

  // Simple last study time calculation
  const getLastStudyTime = () => {
    if (progressPercentage === 0) return "Not started";
    if (progressPercentage === 100) return "Completed";
    return "In progress";
  };

  const result = {
    courseId,
    totalChapters,
    completedChapters,
    progressPercentage,
    estimatedDuration: estimateContentDuration(),
    rating: generateRating(),
    lastStudyTime: getLastStudyTime(),
    materialCounts,
    courseStatus: course.status,
    createdAt: course.createdAt,
    difficulty: course.difficultyLevel || "Intermediate",
    hasFlashcards: materialCounts.flashcard > 0,
    hasQuiz: materialCounts.quiz > 0,
    hasNotes: materialCounts.notes > 0,
    fallback: false,
  };

  const endTime = Date.now();
  console.log(
    `✅ Analytics generated successfully in ${
      endTime - startTime
    }ms for course:`,
    courseId
  );

  return result;
}
