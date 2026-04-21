import { db } from "@/configs/db";
import { QUIZ_ATTEMPT_TABLE, USER_TABLE } from "@/configs/schema";
import { eq, sql } from "drizzle-orm";
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

    // 3.5️⃣ Map to DB User
    const dbUser = await db
      .select({ id: USER_TABLE.id })
      .from(USER_TABLE)
      .where(eq(USER_TABLE.email, email))
      .limit(1);

    if (dbUser.length === 0) {
      return NextResponse.json({ error: "User profile not found in database" }, { status: 404 });
    }
    const userId = dbUser[0].id;

    // 4️⃣ Insert attempt
    const result = await db
      .insert(QUIZ_ATTEMPT_TABLE)
      .values({
        id: uuidv4(),
        userId: userId,
        courseId,
        score,
        totalQuestions,
        percentage,
        timeTaken: isNaN(timeTaken) ? 0 : timeTaken,
        createdAt: new Date(),
      })
      .returning();

    // 5️⃣ Update User Stats using atomic SQL increments
    // Avoids the Read-Modify-Write race condition where two concurrent
    // requests both read the same old value and overwrite each other.
    await db
      .update(USER_TABLE)
      .set({
        // Atomic: DB increments the stored value, no read needed
        quizTotalAttempts: sql`${USER_TABLE.quizTotalAttempts} + 1`,
        quizTotalPercentageSum: sql`${USER_TABLE.quizTotalPercentageSum} + ${percentage}`,
        // GREATEST ensures we never accidentally lower the best score
        quizBestScore: sql`GREATEST(${USER_TABLE.quizBestScore}, ${percentage})`,
        // Recompute average atomically: (sum + new) / (attempts + 1)
        quizAverageScore: sql`ROUND((${USER_TABLE.quizTotalPercentageSum} + ${percentage})::numeric / (${USER_TABLE.quizTotalAttempts} + 1))`,
        quizLastScore: percentage,
      })
      .where(eq(USER_TABLE.id, userId));

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
