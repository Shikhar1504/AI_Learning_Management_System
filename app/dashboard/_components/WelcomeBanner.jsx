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
      <div className="bg-[#111623]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl group">
        {/* Background Decorations */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-teal-500/30 transition-colors duration-700" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/30 transition-colors duration-700" />
        
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
                   <Button className="h-11 px-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all backdrop-blur-sm">
                      View My Courses
                   </Button>
                </Link>

              </div>
            </div>
            
            {/* Right Content - Quick Stats */}
            {userStats && (
              <div className="w-full lg:w-80">
                <div className="bg-[#0B0F1A]/50 p-6 border border-white/5 rounded-2xl relative overflow-hidden group/stats hover:border-white/10 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5 opacity-0 group-hover/stats:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                      <Target className="h-5 w-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Your Progress</h3>
                      <p className="text-xs text-slate-400">Keep learning!</p>
                    </div>
                  </div>
                  
                  <div className="relative z-10 grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-2xl font-bold text-white mb-1">{userStats.courseCount}</div>
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">AI Courses</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-2xl font-bold text-white mb-1">{userStats.streak}</div>
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Day Streak</div>
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
