"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function SignUpClientComponent({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're on the sign-up page with newUser parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isNewUser = urlParams.get('newUser') === 'true';
    
    // If user is already signed in and not a new user from our redirect, redirect to dashboard
    if (isLoaded && isSignedIn && !isNewUser) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  // If user is signed in and not a new user, don't render the sign-up form
  if (isLoaded && isSignedIn) {
    const urlParams = new URLSearchParams(window.location.search);
    const isNewUser = urlParams.get('newUser') === 'true';
    
    if (!isNewUser) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Already Signed In</h2>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        </div>
      );
    }
  }

  return children;
}