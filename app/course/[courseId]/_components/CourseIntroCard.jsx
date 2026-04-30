import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { format } from "date-fns";
import { BarChart3, Calendar, Clock, Play, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function CourseIntroCard({ course }) {
  const { user } = useUser();
  const router = useRouter();


  // Navigation logic for Continue Learning button
  const handleContinueLearning = () => {
    const courseId = course?.courseId;
    if (!courseId) return;

    // For now, let's redirect to the new learning page for all cases as it handles everything
    router.push(`/course/${courseId}/learn`);

    // Determine the next logical step based on progress
    // if (analytics.progressPercentage === 0) {
    //   // If no progress, start with notes
    //   router.push(`/course/${courseId}/notes`);
    // } else if (analytics.progressPercentage < 40) {
    //   // If chapter progress is incomplete, continue with notes
    //   router.push(`/course/${courseId}/notes`);
    // } else if (analytics.progressPercentage < 70 && !analytics.hasFlashcards) {
    //   // If chapters are done but flashcards aren't generated/completed
    //   router.push(`/course/${courseId}/flashcards`);
    // } else if (analytics.progressPercentage < 100 && !analytics.hasQuiz) {
    //   // If flashcards are done but quiz isn't completed
    //   router.push(`/course/${courseId}/quiz`);
    // } else {
    //   // If everything is complete or in progress, go to notes (most recent activity)
    //   router.push(`/course/${courseId}/notes`);
    // }
  };

  // Derived from course prop directly
  const analytics = {
    progressPercentage: course?.progressPercentage || 0,
    estimatedDuration: course?.totalTopics 
      ? `${Math.round((course.totalTopics * 15) / 60)} hrs` 
      : "Calculating...",
    lastStudyTime: "In Progress", // Simplified for now since we removed the field from API
    totalChapters: course?.courseLayout?.chapters?.length || 0,
    completedChapters: 0,
    totalTopics: course?.totalTopics || 0,
    completedTopics: course?.completedTopics || 0,
    fallback: false
  };
  
  const loading = false; // Data is available immediately from prop

  // No local calculation - use API data strictly
  const overallProgress = analytics.progressPercentage || 0;

  const difficulty = course?.difficultyLevel || "Intermediate";
  const createdDate = course?.createdAt
    ? format(new Date(course.createdAt), "MMM dd, yyyy")
    : format(new Date(), "MMM dd, yyyy");

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case "easy":
      case "beginner":
        return "from-green-500 to-emerald-500";
      case "medium":
      case "intermediate":
        return "from-yellow-500 to-orange-500";
      case "hard":
      case "advanced":
        return "from-red-500 to-pink-500";
      default:
        return "from-blue-500 to-cyan-500";
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Course Info & Metadata (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Section */}
          <div className="modern-card relative overflow-hidden p-8 border border-white/[0.08] bg-white/[0.04] backdrop-blur-md rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.08)] hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] transition-shadow duration-500">
             {/* Background Gradients */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl opacity-50" />

            <div className="relative z-10 space-y-6">
              {/* Badge & Date Row */}
              <div className="flex items-center gap-4 text-sm">
                 <div className={`px-4 py-1.5 rounded-full font-semibold text-xs uppercase tracking-wider bg-gradient-to-r ${getDifficultyColor(difficulty)} text-white shadow-lg shadow-cyan-500/20`}>
                    {difficulty}
                 </div>
                 <div className="flex items-center gap-2 text-white/60 font-medium">
                    <Calendar className="h-4 w-4 text-white/80" />
                    <span>{createdDate}</span>
                 </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold font-display text-white leading-tight drop-shadow-sm">
                  {course?.courseLayout?.course_title || course?.courseLayout?.courseTitle || "Course Title"}
                </h1>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl font-light">
                   {course?.courseLayout?.summary || "Master this subject with our comprehensive guide."}
                </p>
              </div>

              {/* Interactive Metadata Grid */}
              <div className="flex flex-wrap gap-6 pt-6 border-t border-white/10">
                 <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                       <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-white">{loading ? "..." : analytics.totalChapters}</p>
                       <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Modules</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                       <Clock className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-white">{loading ? "..." : analytics.estimatedDuration}</p>
                       <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Duration</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                    <div className="p-2 rounded-lg bg-green-500/20 text-green-300">
                       <Play className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-white">{loading ? "..." : analytics.totalTopics}</p>
                       <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Topics</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Progress & Action (Span 1) */}
        <div className="lg:col-span-1 h-full">
          <div className="modern-card p-8 h-full flex flex-col justify-between relative overflow-hidden border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.08)] hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] transition-shadow duration-500">
             
             {/* Progress Status Text */}
             <div className="text-center space-y-2 mb-6">
                <p className="text-sm font-medium text-cyan-300 uppercase tracking-widest">Current Status</p>
                <h3 className="text-xl font-bold text-white min-h-[3.5rem] flex items-center justify-center">
                  {overallProgress === 0 && "Just getting started 🚀"}
                  {overallProgress > 0 && overallProgress < 20 && "Good start! Keep going 🌱"}
                  {overallProgress >= 20 && overallProgress < 60 && "Making solid progress 💪"}
                  {overallProgress >= 60 && overallProgress < 100 && "Almost there! 🔥"}
                  {overallProgress === 100 && "Course Completed 🎉"}
                </h3>
             </div>

             {/* Progress Circle in Center */}
             <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                 <div className="relative w-48 h-48 group">
                   {/* Background Glow */}
                   <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-all duration-700" />
                   
                   {/* Background circle */}
                   <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                     {/* Animated Progress Path */}
                     <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="none" 
                        stroke="url(#gradient-progress)" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        strokeDasharray={`${loading ? 0 : overallProgress * 2.51} 251`} 
                        className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                     />
                     <defs>
                       <linearGradient id="gradient-progress" x1="0%" y1="0%" x2="100%" y2="0%">
                         <stop offset="0%" stopColor="#06b6d4" />
                         <stop offset="100%" stopColor="#3b82f6" />
                       </linearGradient>
                     </defs>
                   </svg>
                   
                   <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                     <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{loading ? "..." : `${Math.round(overallProgress)}%`}</span>
                   </div>
                 </div>
             </div>

             {/* Premium Action Button */}
             <div className="mt-8">
                <Button 
                   onClick={handleContinueLearning}
                   className="w-full h-14 text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] hover:-translate-y-1 transition-all duration-300 border border-white/10 rounded-xl overflow-hidden group relative"
                >
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
                   <span className="relative z-10 flex items-center justify-center gap-3">
                     {overallProgress === 0 ? "Start Course" : overallProgress === 100 ? "Review Course" : "Continue Learning"}
                     <Play className="h-4 w-4 fill-current" />
                   </span>
                </Button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CourseIntroCard;
