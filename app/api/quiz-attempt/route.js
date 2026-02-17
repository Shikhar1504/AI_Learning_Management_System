import { db } from "@/configs/db";
import { QUIZ_ATTEMPT_TABLE, USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    // 1️⃣ Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Parse and validate input
    const body = await req.json();
    const score = Number(body.score);
    const totalQuestions = Number(body.totalQuestions);
    const timeTaken = Number(body.timeTaken);
    const courseId = body.courseId || null;

    if (
      isNaN(score) ||
      isNaN(totalQuestions) ||
      totalQuestions <= 0 ||
      score < 0 ||
      score > totalQuestions
    ) {
      return NextResponse.json(
        { error: "Invalid quiz attempt data" },
        { status: 400 }
      );
    }

    // 3️⃣ Calculate percentage safely
    const percentage = Math.round((score / totalQuestions) * 100);

    // 4️⃣ Insert attempt
    const result = await db
      .insert(QUIZ_ATTEMPT_TABLE)
      .values({
        id: uuidv4(),
        userEmail: email,
        courseId,
        score,
        totalQuestions,
        percentage,
        timeTaken: isNaN(timeTaken) ? 0 : timeTaken,
        createdAt: new Date(),
      })
      .returning();

    // 5️⃣ Update User Stats (Denormalized)
    // Fetch current stats
    const currentUserStats = await db
      .select({
         quizTotalAttempts: USER_TABLE.quizTotalAttempts,
         quizBestScore: USER_TABLE.quizBestScore,
         quizTotalPercentageSum: USER_TABLE.quizTotalPercentageSum,
      })
      .from(USER_TABLE)
      .where(eq(USER_TABLE.email, email))
      .then(res => res[0] || {});

    // Calculate new values
    const currentAttempts = currentUserStats.quizTotalAttempts || 0;
    const currentBest = currentUserStats.quizBestScore || 0;
    const currentSum = currentUserStats.quizTotalPercentageSum || 0;

    const newAttempts = currentAttempts + 1;
    const newBest = Math.max(currentBest, percentage);
    const newSum = currentSum + percentage;
    const newAverage = Math.round(newSum / newAttempts);

    // Update User Table
    await db
      .update(USER_TABLE)
      .set({
        quizTotalAttempts: newAttempts,
        quizBestScore: newBest,
        quizAverageScore: newAverage,
        quizLastScore: percentage,
        quizTotalPercentageSum: newSum
      })
      .where(eq(USER_TABLE.email, email));

    return NextResponse.json({
      success: true,
      attempt: result[0],
    });

  } catch (error) {
    console.error("Error saving quiz attempt:", error);
    return NextResponse.json(
      { error: "Failed to save quiz attempt" },
      { status: 500 }
    );
  }
}
