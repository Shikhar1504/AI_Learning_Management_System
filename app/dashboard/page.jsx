import React, { Suspense } from "react";
import WelcomeBanner from "./_components/WelcomeBanner";
import CourseList from "./_components/CourseList";
import DashboardClient from "./page.client";

async function checkUserAccess() {
  // This is a server-side check that would typically be done via an API call
  // For now, we'll just return true to allow access
  // In a real implementation, this would check if the user exists in the database
  return { allowed: true };
}

function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <DashboardClient />
    </Suspense>
  );
}

export default Dashboard;
