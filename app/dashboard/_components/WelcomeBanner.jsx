"use client";
import { useUser } from "@clerk/nextjs";
import { 
  Target, 
  Zap,
  BookOpen
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ProgressDashboard from "@/components/ui/progress-dashboard";
import Link from "next/link";

function WelcomeBanner({ userStats, loading }) {
  const { user } = useUser();
  const [timeOfDay, setTimeOfDay] = useState("");
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay("morning");
    else if (hour < 17) setTimeOfDay("afternoon");
    else setTimeOfDay("evening");
  }, []);

  const getGreeting = () => {
    const firstName = user?.firstName || "Learner";
    return `Good ${timeOfDay}, ${firstName}!`;
  };

  const getMotivationalMessage = () => {
    if (!userStats) return "Ready to start your AI learning journey?";
    
    if (userStats.courseCount === 0) {
      return "Create your first AI-powered course and begin learning!";
    } else if (userStats.courseCount < 3) {
      return "You're off to a great start! Keep creating and learning.";
    } else {
      return "Amazing progress! You're becoming an AI learning expert.";
    }
  };

  return (
    <div className="space-y-6">
      {/* Simplified Welcome Section */}
      <div className="modern-card p-6 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Content */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gradient-primary font-display leading-tight">
                  {getGreeting()}
                </h1>

                <p className="text-base text-muted-foreground max-w-lg">
                  {getMotivationalMessage()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="#courses">
                   <Button className="h-11 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all backdrop-blur-md">
                      View My Courses
                   </Button>
                </Link>

              </div>
            </div>
            
            {/* Right Content - Quick Stats */}
            {userStats && (
              <div className="w-full lg:w-80">
                <div className="modern-card p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                      <Target className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Your Progress</h3>
                      <p className="text-xs text-muted-foreground">Keep learning!</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-foreground">{userStats.courseCount}</div>
                      <div className="text-xs text-muted-foreground">AI Courses</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{userStats.streak}</div>
                      <div className="text-xs text-muted-foreground">Day Streak</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Simplified Progress Dashboard */}
      <ProgressDashboard className="slide-up" userStats={userStats} />
    </div>
  );
}

export default WelcomeBanner;
