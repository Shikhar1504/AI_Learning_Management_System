import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  Play,
  Calendar,
  BarChart3,
  TrendingUp,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";

function CourseIntroCard({ course }) {
  const { user } = useUser();
  const router = useRouter();
  const [analytics, setAnalytics] = useState({
    progressPercentage: 0,
    estimatedDuration: "Loading...",
    lastStudyTime: "Loading...",
    totalChapters: 0,
    completedChapters: 0
  });
  const [loading, setLoading] = useState(true);

  // Navigation logic for Continue Learning button
  const handleContinueLearning = () => {
    const courseId = course?.courseId;
    if (!courseId) return;

    // Determine the next logical step based on progress
    if (analytics.progressPercentage === 0) {
      // If no progress, start with notes
      router.push(`/course/${courseId}/notes`);
    } else if (analytics.progressPercentage < 40) {
      // If chapter progress is incomplete, continue with notes
      router.push(`/course/${courseId}/notes`);
    } else if (analytics.progressPercentage < 70 && !analytics.hasFlashcards) {
      // If chapters are done but flashcards aren't generated/completed
      router.push(`/course/${courseId}/flashcards`);
    } else if (analytics.progressPercentage < 100 && !analytics.hasQuiz) {
      // If flashcards are done but quiz isn't completed
      router.push(`/course/${courseId}/quiz`);
    } else {
      // If everything is complete or in progress, go to notes (most recent activity)
      router.push(`/course/${courseId}/notes`);
    }
  };

  useEffect(() => {
    if (course?.courseId) {
      fetchAnalytics();
    }
  }, [course?.courseId, user?.primaryEmailAddress?.emailAddress]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/course-analytics', {
        params: {
          courseId: course.courseId,
          userEmail: user?.primaryEmailAddress?.emailAddress
        },
        timeout: 5000 // Reduced to match API timeout
      });
      setAnalytics(response.data);
      
      if (response.data.fallback) {
        console.warn('Using fallback analytics data due to database connectivity issues');
      }
    } catch (error) {
      console.error('Failed to fetch course analytics:', error);
      
      // Set fallback analytics on error
      setAnalytics({
        progressPercentage: 0,
        estimatedDuration: "4-6 hours",
        lastStudyTime: "Unable to load",
        totalChapters: course?.courseLayout?.chapters?.length || 3,
        completedChapters: 0,
        fallback: true,
        error: "Analytics temporarily unavailable"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate comprehensive progress based on chapters, flashcards, and quiz
  const calculateOverallProgress = () => {
    if (loading) return 0;
    
    const totalChapters = analytics.totalChapters || course?.courseLayout?.chapters?.length || 3;
    const completedChapters = analytics.completedChapters || 0;
    
    // Weight: Chapters 40%, Flashcards 30%, Quiz 30%
    const chapterProgress = totalChapters > 0 ? (completedChapters / totalChapters) * 40 : 0;
    
    // Check if flashcards and quiz are generated (this would come from study materials)
    const hasFlashcards = analytics.hasFlashcards || false;
    const hasQuiz = analytics.hasQuiz || false;
    
    const flashcardProgress = hasFlashcards ? 30 : 0;
    const quizProgress = hasQuiz ? 30 : 0;
    
    const totalProgress = Math.round(chapterProgress + flashcardProgress + quizProgress);
    return Math.min(totalProgress, 100);
  };

  const overallProgress = calculateOverallProgress();

  const difficulty = course?.difficultyLevel || "Intermediate";
  const createdDate = course?.createdAt 
    ? format(new Date(course.createdAt), "MMM dd, yyyy")
    : format(new Date(), "MMM dd, yyyy");

  const getDifficultyColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'easy': 
      case 'beginner': return 'from-green-500 to-emerald-500';
      case 'medium':
      case 'intermediate': return 'from-yellow-500 to-orange-500';
      case 'hard':
      case 'advanced': return 'from-red-500 to-pink-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  return (
    <div className="w-full space-y-12">
      {/* Course Hero Section */}
      <div className="modern-card relative overflow-hidden p-8 lg:p-12">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/3 to-blue-500/3" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Course Icon */}
            <div className="flex-shrink-0">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <Image 
                    src="/knowledge.png"
                    alt="Course Icon"
                    width={64}
                    height={64}
                    className="object-contain filter drop-shadow-lg"
                  />
                </div>
              </div>
            </div>
            
            {/* Course Information */}
            <div className="flex-1 space-y-6">
              {/* Title and Badge */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                    {course?.courseLayout?.course_title ||
                      course?.courseLayout?.courseTitle ||
                      "Course Title"}
                  </h1>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${getDifficultyColor(difficulty)} text-white shadow-lg`}>
                    {difficulty}
                  </div>
                </div>
                
                <p className="text-lg text-gray-300 leading-relaxed max-w-4xl">
                  {course?.courseLayout?.summary || "This course provides comprehensive learning materials designed to help you master the subject effectively."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Stats and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Stats Section */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Course Overview</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chapters */}
            <div className="modern-card p-6 hover:scale-105 transition-transform duration-300">
              <div className="text-center space-y-4">
                <div className="p-4 rounded-xl bg-purple-500/20 mx-auto w-fit">
                  <BarChart3 className="h-8 w-8 text-purple-400" />
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-white">
                    {loading ? "..." : analytics.totalChapters || 0}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Chapters</h3>
                    <p className="text-sm text-gray-400">Learning modules</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="modern-card p-6 hover:scale-105 transition-transform duration-300">
              <div className="text-center space-y-4">
                <div className="p-4 rounded-xl bg-blue-500/20 mx-auto w-fit">
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <div className="text-xl font-bold text-white">
                    {loading ? "..." : analytics.estimatedDuration}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Duration</h3>
                    <p className="text-sm text-gray-400">Estimated time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Created */}
            <div className="modern-card p-6 hover:scale-105 transition-transform duration-300">
              <div className="text-center space-y-4">
                <div className="p-4 rounded-xl bg-green-500/20 mx-auto w-fit">
                  <Calendar className="h-8 w-8 text-green-400" />
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-bold text-white">
                    {createdDate}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Created</h3>
                    <p className="text-sm text-gray-400">Launch date</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Section */}
        <div className="lg:col-span-2">
          <div className="modern-card p-8 h-full">
            <div className="space-y-8">
              {/* Progress Header */}
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Progress</h2>
                {analytics.fallback && (
                  <div className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                    <span className="text-xs text-orange-400">Offline</span>
                  </div>
                )}
              </div>
              
              {/* Progress Circle */}
              <div className="flex flex-col items-center space-y-6">
                <div className="relative w-32 h-32">
                  {/* Background circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${loading ? 0 : (overallProgress * 2.51)} 251`}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {loading ? "..." : `${overallProgress}%`}
                    </span>
                    <span className="text-sm text-gray-400">Complete</span>
                  </div>
                </div>
                
                {/* Progress Status */}
                <div className="text-center space-y-2">
                  {!loading && overallProgress > 0 && overallProgress < 100 &&(
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm font-medium text-green-400">In Progress</span>
                    </div>
                  )}
                  {!loading && overallProgress === 0 && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-sm font-medium text-gray-400">Not Started</span>
                    </div>
                  )}
                  {!loading && overallProgress === 100 && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm font-medium text-green-400">Completed</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      {loading 
                        ? "Loading..." 
                        : `${analytics.completedChapters} of ${analytics.totalChapters} chapters completed`
                      }
                    </p>
                    <div className="flex justify-center gap-4 text-xs text-gray-500">
                      <span>📚 Chapters: {Math.round((analytics.completedChapters / (analytics.totalChapters || 1)) * 40)}%</span>
                      <span>🃏 Flashcards: {analytics.hasFlashcards ? '30%' : '0%'}</span>
                      <span>❓ Quiz: {analytics.hasQuiz ? '30%' : '0%'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <Button 
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0 transition-all duration-300 hover:scale-105" 
                disabled={loading}
                onClick={handleContinueLearning}
              >
                <Play className="h-5 w-5 mr-3" />
                {loading 
                  ? 'Loading...' 
                  : overallProgress > 0 
                    ? 'Continue Learning' 
                    : 'Start Course'
                }
              </Button>
              
              {/* Last Studied */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Last studied</span>
                  <span className="text-sm text-white font-medium">
                    {loading ? "..." : analytics.lastStudyTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseIntroCard;
