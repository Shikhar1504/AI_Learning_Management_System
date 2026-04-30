"use client";
import { CourseCountContext } from "@/app/_context/CourseCountContext";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { RefreshCw, BookOpen, Plus, Sparkles, Eye, EyeOff } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import CourseCardItem from "./CourseCardItem";
import Link from "next/link";
import Image from "next/image";

function CourseList({ courses, loading, onRefresh }) {
  const { user } = useUser();
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { setTotalCourse } = useContext(CourseCountContext);

  // Update context when courses change
  useEffect(() => {
    if (courses) {
      setTotalCourse(courses.length);
    }
  }, [courses, setTotalCourse]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="loading-shimmer h-80 rounded-2xl"
          style={{ animationDelay: `${index * 100}ms` }}
        />
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-8 md:py-16">
      <div className="bg-[#111623]/80 border border-white/5 rounded-2xl shadow-xl backdrop-blur-sm p-6 md:p-12 max-w-lg mx-auto">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <BookOpen className="h-10 w-10 md:h-12 md:w-12 text-purple-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-bounce">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <h3 className="heading-3 text-foreground mb-3 font-display text-xl md:text-2xl">
          Your Learning Journey Starts Here
        </h3>
        
        <p className="body-regular text-muted-foreground mb-8 max-w-md mx-auto text-sm md:text-base">
          Create your first AI-powered course and begin an amazing learning experience tailored just for you.
        </p>
        
        <div className="space-y-6">
          <Link href="/create" className="block w-full">
            <Button className="bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white border-0 h-12 px-8 w-full sm:w-auto shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Course
            </Button>
          </Link>
          
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Interactive</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Personalized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const courseList = courses || [];

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!courseList || courseList.length === 0) {
    return <EmptyState />;
  }

  // Mobile course limiting logic
  const mobileLimit = 10;
  const shouldLimitOnMobile = isMobile && courseList.length > mobileLimit;
  const displayedCourses = shouldLimitOnMobile && !showAllCourses 
    ? courseList.slice(0, mobileLimit) 
    : courseList;
  const hiddenCoursesCount = courseList.length - mobileLimit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
            <h3 className="heading-3 text-foreground font-display">My Courses</h3>
          </div>
          <p className="body-small text-muted-foreground ml-7">
            {isMobile && shouldLimitOnMobile && !showAllCourses ? (
              <>
                Showing {displayedCourses.length} of {courseList.length} courses
                <span className="text-xs text-purple-400 ml-1">(recent)</span>
              </>
            ) : (
              <>
                {courseList.length} {courseList.length === 1 ? 'course' : 'courses'} in your library
              </>
            )}
          </p>
        </div>
        
        <Button 
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl h-10 px-4 transition-all backdrop-blur-sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
          Refresh
        </Button>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedCourses.map((course, index) => (
          <div 
            key={course.id || index}
            className="fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CourseCardItem course={course} onCourseUpdate={onRefresh} />
          </div>
        ))}
        
        {/* Add Course Card */}
        <Link href="/create">
          <div className="bg-[#111623] border border-teal-500/20 rounded-2xl shadow-[0_0_30px_rgba(20,184,166,0.05)] hover:border-teal-500/40 hover:-translate-y-1 transition-all p-8 text-center h-full min-h-[300px] flex flex-col items-center justify-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <Image 
                  src="/content.png"
                  alt="Create Course"
                  width={48}
                  height={48}
                  className="object-contain filter drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-300"
                />
              </div>
            </div>
            
            <h4 className="relative z-10 font-semibold text-white mb-2 group-hover:text-teal-400 transition-colors">
              Create New Course
            </h4>
            
            <p className="relative z-10 text-sm text-slate-400">
              Generate AI-powered content
            </p>
          </div>
        </Link>
      </div>

      {/* Mobile Toggle Button */}
      {shouldLimitOnMobile && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => setShowAllCourses(!showAllCourses)}
            variant="outline"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl h-10 px-6 transition-all backdrop-blur-sm"
          >
            {showAllCourses ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Show Recent ({mobileLimit})
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show All ({courseList.length})
                <span className="ml-1 text-xs text-muted-foreground">
                  +{hiddenCoursesCount} more
                </span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default CourseList;
