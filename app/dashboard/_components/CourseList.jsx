"use client";
import { CourseCountContext } from "@/app/_context/CourseCountContext";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { RefreshCw, BookOpen, Plus, Sparkles, Eye, EyeOff } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import CourseCardItem from "./CourseCardItem";
import Link from "next/link";
import Image from "next/image";

function CourseList() {
  const { user } = useUser();
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { totalCourse, setTotalCourse } = useContext(CourseCountContext);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    user && GetCourseList();
  }, [user]);

  const GetCourseList = async () => {
    setLoading(true);
    try {
      const result = await axios.post("/api/courses", {
        createdBy: user?.primaryEmailAddress?.emailAddress,
      });
      setCourseList(result.data.result);
      setTotalCourse(result.data.result.length);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="text-center py-16">
      <div className="modern-card p-12 max-w-lg mx-auto">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-purple-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-bounce">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <h3 className="heading-3 text-foreground mb-3 font-display">
          Your Learning Journey Starts Here
        </h3>
        
        <p className="body-regular text-muted-foreground mb-8 max-w-md mx-auto">
          Create your first AI-powered course and begin an amazing learning experience tailored just for you.
        </p>
        
        <div className="space-y-4">
          <Link href="/create">
            <Button className="btn-primary h-12 px-8">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Course
            </Button>
          </Link>
          
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Interactive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Personalized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
          onClick={GetCourseList}
          variant="outline"
          size="sm"
          className="btn-secondary h-10 px-4 border-white/20"
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
            <CourseCardItem course={course} onCourseUpdate={GetCourseList} />
          </div>
        ))}
        
        {/* Add Course Card */}
        <Link href="/create">
          <div className="modern-card-interactive p-8 text-center h-full min-h-[300px] flex flex-col items-center justify-center group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
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
            
            <h4 className="font-semibold text-foreground mb-2 group-hover:text-gradient-primary transition-all">
              Create New Course
            </h4>
            
            <p className="text-sm text-muted-foreground">
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
            className="btn-secondary h-10 px-6 border-white/20"
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
