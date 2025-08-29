import { NextResponse } from "next/server";
import UserStatsService from "@/lib/userStatsService";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const stats = await UserStatsService.getUserStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch user stats",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const activityData = await request.json();

    // Update user stats using the UserStatsService
    const result = await UserStatsService.updateUserStats(userId, activityData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating user stats:", error);

    return NextResponse.json(
      {
        error: "Failed to update user stats",
        details: error.message,
      },
      { status: 500 }
    );
  }
}