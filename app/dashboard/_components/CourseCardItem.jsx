import { Button } from "@/components/ui/button";
import axios from "axios";
import { format } from "date-fns";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

function CourseCardItem({ course, onCourseUpdate }) {
  // Derived analytics from course prop (O(1) access)
  const analytics = {
    progressPercentage: course?.progressPercentage || 0,
    totalChapters: course?.courseLayout?.chapters?.length || 0,
    completedChapters: 0, // Not strictly tracked in DB anymore, irrelevant for card
    totalTopics: course?.totalTopics || 0,
    completedTopics: course?.completedTopics || 0,
    estimatedDuration: course?.totalTopics 
      ? `${Math.round((course.totalTopics * 15) / 60)} hrs` 
      : "Calculating...",
    fallback: false
  };
  
  const loadingAnalytics = false; // Data is instant now
  const analyticsError = null;
  const statusCheckIntervalRef = useRef(null);

  // Check course status for auto-reload
  const checkCourseStatus = useCallback(async () => {
    if (!course?.courseId || !course?.createdBy) return;

    try {
      const response = await axios.post(
        "/api/courses",
        {
          createdBy: course.createdBy,
        },
        {
          timeout: 5000,
        }
      );

      const courses = response.data.result || [];
      const updatedCourse = courses.find((c) => c.courseId === course.courseId);

      // If status changed from "Generating" to "Ready", reload the page
      if (
        course?.status === "Generating" &&
        updatedCourse?.status === "Ready"
      ) {
        console.log("✅ Course generation completed! Reloading page...");

        // Clear the interval
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }

        // Refresh analytics happens via parent update


        // Notify parent to update course list
        if (onCourseUpdate) {
          onCourseUpdate();
        }

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.warn("Failed to check course status:", error.message);
    }
  }, [
    course?.courseId,
    course?.createdBy,
    course?.status,
    onCourseUpdate,
  ]);



  // Start/stop status polling based on course status
  useEffect(() => {
    // Clear any existing interval first
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }

    if (course?.status === "Generating") {
      // Start polling every 30 seconds to check if generation is complete
      const interval = setInterval(() => {
        checkCourseStatus();
      }, 30000); // Check every 30 seconds

      statusCheckIntervalRef.current = interval;
      console.log("🔄 Started polling for course generation completion...");
    } else {
      console.log("⏹️ Stopped polling - course not generating");
    }

    // Cleanup on unmount
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [course?.status, checkCourseStatus]);

  const handleDeleteCourse = async () => {
    if (!course?.courseId) return;

    const courseTitle =
      course?.courseLayout?.courseTitle ||
      course?.courseLayout?.course_title ||
      "this course";

    // Use browser's confirm dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${courseTitle}"?\n\nThis action cannot be undone and will permanently remove:\n• The course\n• All chapter notes\n• All flashcards\n• All quizzes`
    );

    if (!confirmed) return;

    try {
      const response = await axios.delete(
        `/api/courses?courseId=${course.courseId}`
      );

      if (response.data.success) {
        alert("✅ Course deleted successfully!");
        console.log("✅ Course deleted successfully");

        // Refresh the course list
        if (onCourseUpdate) {
          onCourseUpdate();
        }
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
      alert("❌ Failed to delete course. Please try again.");
    }
  };

  // Calculate comprehensive progress based on chapters, flashcards, and quiz
  const calculateOverallProgress = () => {
    if (loadingAnalytics) {
       return 0;
    }
    return analytics.progressPercentage || 0;
  };

  const overallProgress = calculateOverallProgress();

  const currentDate = course?.createdAt
    ? format(new Date(course.createdAt), "MMM dd, yyyy")
    : format(new Date(), "MMM dd, yyyy");

  const progressPercentage = Math.min(overallProgress, 100);
  const isCompleted = progressPercentage >= 100;
  const isGenerating = course?.status === "Generating";

  const getStatusColor = () => {
    if (isCompleted) return "from-green-500 to-emerald-500";
    if (isGenerating) return "from-orange-500 to-yellow-500";
    return "from-purple-500 to-blue-500";
  };

  const getStatusText = () => {
    if (isCompleted) return "Completed";
    if (isGenerating) return "Generating";
    if (progressPercentage > 0) return "In Progress";
    return "Ready to Start";
  };

  return (
    <div className="group relative h-full rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 flex flex-col">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="p-5 flex-1 flex flex-col relative z-10">
        {/* Header: Icon + Badge + Menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
             <div
               className={`p-2.5 rounded-lg bg-gradient-to-br ${getStatusColor()}/10 group-hover:scale-110 transition-transform duration-300`}
             >
               {isCompleted ? (
                 <CheckCircle className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-primary'}`} />
               ) : isGenerating ? (
                 <RefreshCw className="h-5 w-5 text-orange-400 animate-spin" />
               ) : (
                 <BookOpen className="h-5 w-5 text-primary" />
               )}
             </div>
             {/* Status Badge */}
             <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                isCompleted 
                  ? "bg-green-500/10 text-green-500 border-green-500/20" 
                  : isGenerating
                  ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                  : "bg-primary/5 text-primary border-primary/10"
             }`}>
                {getStatusText()}
             </div>
          </div>

          {/* Delete Action - Fade in on hover */}
          {!isGenerating && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // For now, simpler direct delete conform, can upgrade to dropdown later
                  handleDeleteCourse();
                }}
              >
                <Trash2 className="h-4 w-4" /> 
              </Button>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2 mb-6">
          <h3 className="font-bold text-lg text-foreground line-clamp-1 leading-tight group-hover:text-primary transition-colors">
            {course?.courseLayout?.courseTitle ||
              course?.courseLayout?.course_title ||
              "Untitled Course"}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[3em]">
            {course?.courseLayout?.summary || "No description available."}
          </p>
        </div>
        
        {/* Progress Bar Section (Polished) */}
        {!isGenerating && (
           <div className="mt-auto mb-4 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                 <span className="text-muted-foreground">{Math.round(progressPercentage)}% Complete</span>
              </div>
              <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                 <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                 />
              </div>
           </div>
        )}

        {/* Footer: Metadata + Action */}
        <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
               <div className="flex items-center gap-1.5" title="Chapters">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{analytics.totalChapters || 0}</span>
               </div>
               <div className="flex items-center gap-1.5" title="Estimated Time">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{analytics.estimatedDuration?.replace(' hrs', 'h') || '0h'}</span>
               </div>
            </div>

            {/* Action */}
            {isGenerating ? (
               <div className="flex items-center gap-2 text-xs text-orange-400 font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Building...</span>
               </div>
            ) : (
               <Link href={`/course/${course?.courseId}${isCompleted ? '' : '/learn'}`}>
                  <button className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-all group/btn">
                     {isCompleted ? 'Review' : 'Continue'}
                     <Play className="h-3 w-3 fill-current transform group-hover/btn:translate-x-1 transition-transform duration-200" />
                  </button>
               </Link>
            )}
        </div>
      </div>
    </div>
  );
}

export default CourseCardItem;
