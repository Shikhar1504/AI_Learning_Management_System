import { db } from "@/configs/db";
import { USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { user } = await request.json();

    if (!user || !user.id || !user.email) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    // Synchronous upsert: guarantees user row exists before returning.
    await db
      .insert(USER_TABLE)
      .values({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .onConflictDoNothing({ target: USER_TABLE.email });

    // Keep user profile fresh if name changed.
    await db
      .update(USER_TABLE)
      .set({ name: user.name })
      .where(eq(USER_TABLE.email, user.email));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
