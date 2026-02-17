import { db } from "@/configs/db";
import { USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
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

    // 2️⃣ Fetch user stats directly from USER_TABLE (O(1))
    const userStats = await db
      .select({
        totalAttempts: USER_TABLE.quizTotalAttempts,
        bestScore: USER_TABLE.quizBestScore,
        averageScore: USER_TABLE.quizAverageScore,
        lastScore: USER_TABLE.quizLastScore,
      })
      .from(USER_TABLE)
      .where(eq(USER_TABLE.email, email))
      .then(res => res[0]);

    if (!userStats) {
      return NextResponse.json({
        totalAttempts: 0,
        bestScore: 0,
        averageScore: 0,
        lastScore: 0,
      });
    }

    return NextResponse.json({
      totalAttempts: userStats.totalAttempts || 0,
      bestScore: userStats.bestScore || 0,
      averageScore: userStats.averageScore || 0,
      lastScore: userStats.lastScore || 0,
    });

  } catch (error) {
    console.error("Error fetching quiz stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
