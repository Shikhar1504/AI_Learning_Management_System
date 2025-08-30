import { Button } from "@/components/ui/button";
import axios from "axios";
import { format } from "date-fns";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function CourseCardItem({ course, onCourseUpdate }) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState({
    progressPercentage: 0,
    hasFlashcards: false,
    hasQuiz: false,
    hasNotes: false,
    totalChapters: 0,
    completedChapters: 0,
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);
  const statusCheckIntervalRef = useRef(null);
  const analyticsRequestRef = useRef(null); // Track ongoing requests

  const fetchCourseAnalytics = useCallback(
    async (retryCount = 0) => {
      // Cancel any ongoing request
      if (analyticsRequestRef.current) {
        analyticsRequestRef.current.cancel("New request initiated");
      }

      const maxRetries = 0; // Disabled retries to prevent multiple concurrent requests

      try {
        setLoadingAnalytics(true);
        setAnalyticsError(null);

        // Create cancellable request
        const source = axios.CancelToken.source();
        analyticsRequestRef.current = source;

        const response = await axios.get("/api/course-analytics", {
          params: {
            courseId: course.courseId,
          },
          timeout: 10000, // Increased to 10 seconds
          cancelToken: source.token,
        });

        // Clear the request reference on success
        analyticsRequestRef.current = null;

        setAnalytics(response.data);

        // Log if using fallback data
        if (response.data.fallback) {
          console.warn(
            "📊 Using fallback analytics data for course:",
            course.courseId
          );
          if (response.data.ultraFast) {
            console.warn(
              "⚡ Using ultra-fast fallback for course:",
              course.courseId
            );
          }
        }
      } catch (error) {
        // Clear the request reference
        analyticsRequestRef.current = null;

        // Don't log errors for cancelled requests
        if (axios.isCancel(error)) {
          console.log(
            "Analytics request cancelled for course:",
            course.courseId
          );
          return;
        }

        console.error(`Failed to fetch course analytics:`, error);
        setAnalyticsError(error.message);

        // Simplified error handling without retries
        if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          console.warn("⏱️ Analytics request timed out, using local fallback");
        } else if (error.response?.status === 404) {
          console.warn("🔍 Analytics endpoint not found, using local fallback");
        } else if (error.response?.status >= 500) {
          console.warn("🔧 Server error in analytics, using local fallback");
        }

        // Use enhanced fallback values with better defaults
        setAnalytics({
          progressPercentage: 0,
          hasFlashcards: false,
          hasQuiz: false,
          hasNotes: course?.courseLayout?.chapters?.length > 0,
          totalChapters: course?.courseLayout?.chapters?.length || 3,
          completedChapters: 0,
          estimatedDuration: "Calculating...",
          rating: 0,
          lastStudyTime: "Not started",
          materialCounts: {
            flashcard: 0,
            quiz: 0,
            notes: 0,
          },
          courseStatus: course?.status || "Ready",
          difficulty: "Intermediate",
          fallback: true,
        });
      } finally {
        setLoadingAnalytics(false);
      }
    },
    [course?.courseId, course?.courseLayout?.chapters?.length, course?.status]
  );

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

        // Refresh analytics first
        await fetchCourseAnalytics();

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
    fetchCourseAnalytics,
    onCourseUpdate,
  ]);

  useEffect(() => {
    if (course?.courseId) {
      fetchCourseAnalytics();
    }
  }, [course?.courseId]);

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
      // Cancel any ongoing analytics requests
      if (analyticsRequestRef.current) {
        analyticsRequestRef.current.cancel("Component unmounting");
        analyticsRequestRef.current = null;
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
      // Show estimated progress based on course status while loading
      if (course?.status === "Ready") return 5; // Ready courses have some initial progress
      if (course?.status === "Generating") return 0;
      return 0;
    }

    const totalChapters =
      analytics.totalChapters || course?.courseLayout?.chapters?.length || 3;
    const completedChapters = analytics.completedChapters || 0;

    // Enhanced weight calculation with fallback handling
    // Weight: Chapters 40%, Flashcards 30%, Quiz 30%
    const chapterProgress =
      totalChapters > 0 ? (completedChapters / totalChapters) * 40 : 0;
    const flashcardProgress =
      analytics.hasFlashcards || analytics.materialCounts?.flashcard > 0
        ? 30
        : 0;
    const quizProgress =
      analytics.hasQuiz || analytics.materialCounts?.quiz > 0 ? 30 : 0;

    const totalProgress = Math.round(
      chapterProgress + flashcardProgress + quizProgress
    );
    return Math.min(totalProgress, 100);
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
    <div className="modern-card-interactive group relative overflow-hidden h-full">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
        <div
          className={`h-full bg-gradient-to-r ${getStatusColor()} transition-all duration-1000 ease-out`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${getStatusColor()}/20 group-hover:scale-110 transition-transform duration-300`}
          >
            {isCompleted ? (
              <CheckCircle className="h-6 w-6 text-green-400" />
            ) : isGenerating ? (
              <RefreshCw className="h-6 w-6 text-orange-400 animate-spin" />
            ) : (
              <BookOpen className="h-6 w-6 text-purple-400" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                isCompleted
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : isGenerating
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  : "bg-purple-500/20 text-purple-400 border-purple-500/30"
              }`}
            >
              {getStatusText()}
            </div>

            {/* Delete Button */}
            {!isGenerating && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteCourse();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-foreground line-clamp-2 mb-3 group-hover:text-gradient-primary transition-all font-display">
            {course?.courseLayout?.courseTitle ||
              course?.courseLayout?.course_title ||
              "Untitled Course"}
          </h3>

          <p className="body-small text-muted-foreground line-clamp-3 mb-6">
            {course?.courseLayout?.summary || "No description available."}
          </p>
        </div>

        {/* Footer */}
        <div className="space-y-4">
          {/* Progress */}
          {!isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium text-foreground">
                  {loadingAnalytics ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    `${progressPercentage}%`
                  )}
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className={`h-full bg-gradient-to-r ${getStatusColor()} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Progress Breakdown */}
              {!loadingAnalytics && progressPercentage > 0 && (
                <div className="flex justify-center gap-3 text-xs text-gray-500">
                  <span
                    className="flex items-center gap-1"
                    title="Chapter Progress"
                  >
                    📚{" "}
                    {Math.round(
                      ((analytics.completedChapters || 0) /
                        (analytics.totalChapters || 1)) *
                        40
                    )}
                    %
                  </span>
                  <span className="flex items-center gap-1" title="Flashcards">
                    🃏{" "}
                    {analytics.hasFlashcards ||
                    analytics.materialCounts?.flashcard > 0
                      ? "30%"
                      : "0%"}
                  </span>
                  <span className="flex items-center gap-1" title="Quiz">
                    ❓{" "}
                    {analytics.hasQuiz || analytics.materialCounts?.quiz > 0
                      ? "30%"
                      : "0%"}
                  </span>
                  {analytics.fallback && (
                    <span
                      className="flex items-center gap-1 text-orange-400"
                      title="Using fallback data"
                    >
                      ⚠️
                    </span>
                  )}
                </div>
              )}

              {/* Error indicator */}
              {analyticsError && !loadingAnalytics && (
                <div className="text-xs text-orange-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Displaying estimated data</span>
                </div>
              )}
            </div>
          )}

          {/* Date & Action */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {currentDate}
            </div>

            {isGenerating ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-orange-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Generating...</span>
                </div>

                {/* Expected Duration Message */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-3">
                  <div className="flex items-start gap-2 text-xs text-orange-300">
                    <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">
                        Please wait patiently...
                      </p>
                      <p className="text-orange-400/80">
                        Content generation typically takes 5-10 minutes. The
                        page will refresh automatically once complete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link href={`/course/${course?.courseId}`}>
                <Button
                  size="sm"
                  className={`btn-primary h-9 px-4 text-sm font-medium group-hover:scale-105 transition-all duration-300`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Review
                    </>
                  ) : progressPercentage > 0 ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Continue
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseCardItem;
