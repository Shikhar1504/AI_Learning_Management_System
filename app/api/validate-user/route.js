import { db } from "@/configs/db";
import { USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = getAuth(request);
    
    // If no user is authenticated, return unauthorized
    if (!userId) {
      return NextResponse.json({ valid: false, redirect: '/sign-in' }, { status: 401 });
    }
    
    const { email } = await request.json();
    
    // Log for debugging
    if (!email) {
      console.error("User email not found for user:", userId);
      return NextResponse.json({ valid: false, redirect: '/sign-in' }, { status: 400 });
    }
    
    // Check if user exists in our database
    const result = await db
      .select()
      .from(USER_TABLE)
      .where(eq(USER_TABLE.email, email))
      .limit(1);
    
    const userExists = result.length > 0;
    
    if (userExists) {
      // User exists in our database
      return NextResponse.json({ valid: true });
    } else {
      // User does not exist in our database
      // Redirect to sign-up page with proper parameters to show social login options
      const redirectUrl = `/sign-up?newUser=true&message=Please%20complete%20your%20registration&email=${encodeURIComponent(email)}`;
      return NextResponse.json({ 
        valid: false, 
        redirect: redirectUrl
      }, { status: 403 });
    }
    
  } catch (error) {
    console.error("Error validating user:", error);
    // On error, redirect to sign-up as a safer fallback
    return NextResponse.json({ 
      valid: false, 
      redirect: '/sign-up?error=validation_failed&message=Please%20complete%20your%20registration'
    }, { status: 500 });
  }
}