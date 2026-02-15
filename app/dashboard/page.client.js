"use client";

import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { useEffect, useState } from "react";
import WelcomeBanner from "./_components/WelcomeBanner";
import CourseList from "./_components/CourseList";

export default function DashboardClient() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState({
    userStats: null,
    courses: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    try {
      setLoading(true);
      const response = await axios.get("/api/dashboard-data", {
        params: {
          userEmail: user.primaryEmailAddress.emailAddress,
        },
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="slide-up">
        <WelcomeBanner userStats={dashboardData.userStats} loading={loading} />
      </section>
      
      {/* Courses Section */}
      <section className="slide-up" style={{ animationDelay: '200ms' }} data-courses-section>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="heading-3 text-foreground font-display">Your Courses</h2>
              <p className="body-regular text-muted-foreground mt-1">
                Continue learning or create something new
              </p>
            </div>
          </div>
          <CourseList 
            courses={dashboardData.courses} 
            loading={loading} 
            onRefresh={fetchDashboardData} 
          />
        </div>
      </section>
    </div>
  );
}
