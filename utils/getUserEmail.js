import { getAuth } from "@clerk/nextjs/server";

/**
 * Get user email from Clerk session
 * @param {Request} request - Next.js request object
 * @returns {string|null} User email or null if not found
 */
export function getUserEmail(request) {
  try {
    const { sessionClaims } = getAuth(request);
    
    // Try multiple ways to get the email
    if (sessionClaims?.email) {
      return sessionClaims.email;
    }
    
    if (sessionClaims?.user?.email) {
      return sessionClaims.user.email;
    }
    
    // If we still don't have an email, return null
    return null;
  } catch (error) {
    console.error("Error getting user email:", error);
    return null;
  }
}