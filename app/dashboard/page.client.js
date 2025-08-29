"use client";

import WelcomeBanner from "./_components/WelcomeBanner";
import CourseList from "./_components/CourseList";

export default function DashboardClient() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="slide-up">
        <WelcomeBanner />
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
          <CourseList />
        </div>
      </section>
    </div>
  );
}
