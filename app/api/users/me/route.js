import { NextResponse } from "next/server";
import { db } from "@/configs/db";
import { USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const rows = await db
      .select({
        id: USER_TABLE.id,
        email: USER_TABLE.email,
        isMember: USER_TABLE.isMember,
        customerId: USER_TABLE.customerId,
      })
      .from(USER_TABLE)
      .where(eq(USER_TABLE.email, email))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: rows[0] || null,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
