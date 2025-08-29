"use client";
import { UserProfile } from "@clerk/nextjs";
import ProgressDashboard from "@/components/ui/progress-dashboard";
import { useEffect } from "react";

function Profile() {
  // Use client-side code to hide the Clerk footer
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .cl-footer, .cl-branded-footer, .cl-development-mode, .cl-powered-by-clerk, .cl-powered-by-container {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div className="space-y-8">
      {/* Simple Progress Overview */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Learning Overview</h2>
        <ProgressDashboard />
      </div>
      
      {/* Clerk User Profile */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Account Settings</h2>
        <div className="flex justify-center">
          <UserProfile routing="hash" />
        </div>
      </div>
    </div>
  );
}

export default Profile;
