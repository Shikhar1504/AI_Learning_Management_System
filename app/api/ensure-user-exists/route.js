import { db } from "@/configs/db";
import { USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(request) {
  try {
    const { user } = await request.json();

    if (!user || !user.id || !user.email) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    // First, check if user exists directly in the database
    const existingUser = await db
      .select()
      .from(USER_TABLE)
      .where(eq(USER_TABLE.email, user.email))
      .limit(1);

    if (existingUser.length === 0) {
      // If user doesn't exist, trigger the Inngest function to create the user
      try {
        // Format the user data to match what the CreateNewUser function expects
        await inngest.send({
          name: "user.create",
          data: {
            user: {
              id: user.id,
              fullName: user.name,
              primaryEmailAddress: {
                emailAddress: user.email
              }
            },
          },
        });
        
        // Return success immediately while the user creation continues in background
        return NextResponse.json({ success: true, message: "User creation initiated" });
      } catch (inngestError) {
        console.error("Error triggering Inngest function:", inngestError);
        
        // Fallback to direct database insertion if Inngest fails
        await db.insert(USER_TABLE).values({
          id: user.id,
          name: user.name,
          email: user.email,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
