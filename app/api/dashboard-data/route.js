import { NextResponse } from "next/server";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, USER_TABLE } from "@/configs/schema";
import { eq, desc } from "drizzle-orm";
import UserStatsService from "@/lib/userStatsService";

// Force dynamic since we're fetching user-specific data
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Parallel fetch for maximum performance
    const [stats, courses] = await Promise.all([
      UserStatsService.getUserStats(userEmail),
      db
        .select()
        .from(STUDY_MATERIAL_TABLE)
        .where(eq(STUDY_MATERIAL_TABLE.createdBy, userEmail))
        .orderBy(desc(STUDY_MATERIAL_TABLE.createdAt)),
    ]);

    return NextResponse.json({
      userStats: stats,
      courses: courses,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
