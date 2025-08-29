"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import CourseIntroCard from "./_components/CourseIntroCard";
import StudyMaterialSection from "./_components/StudyMaterialSection";
import ChapterList from "./_components/ChapterList";
import axios from "axios";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function Course() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (courseId) GetCourse();
  }, [courseId]);

  const GetCourse = async () => {
    try {
      setLoading(true);
      const result = await axios.get("/api/courses?courseId=" + courseId);
      setCourse(result.data.result);
      setError(null);
    } catch (error) {
      console.error("Error fetching course:", error);
      setError("Failed to load course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-muted-foreground">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Course Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/dashboard">
            <Button className="btn-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Course Introduction */}
      <section className="fade-in">
        <CourseIntroCard course={course} />
      </section>
      
      {/* Study Materials */}
      <section className="slide-up" style={{ animationDelay: '200ms' }}>
        <StudyMaterialSection courseId={courseId} course={course} /> 
      </section>
      
      {/* Chapter List */}
      <section className="slide-up" style={{ animationDelay: '400ms' }}>
        <ChapterList course={course} />
      </section>
    </div>
  );
}

export default Course;