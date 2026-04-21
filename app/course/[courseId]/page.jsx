"use client";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import CourseIntroCard from "./_components/CourseIntroCard";
import StudyMaterialSection from "./_components/StudyMaterialSection";
import ChapterList from "./_components/ChapterList";
import axios from "axios";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import StudyTips from "./_components/StudyTips";

function Course() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const GetCourse = useCallback(async () => {
    try {
      setLoading(true);
      const result = await axios.get("/api/courses?courseId=" + courseId);
      setCourse(result.data.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching course:", error);
      setError("Failed to load course. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) GetCourse();
  }, [courseId, GetCourse]);

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
          <h2 className="text-xl font-semibold text-foreground">
            Course Not Found
          </h2>
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
    <div className="space-y-12 pb-20">
      {/* Course Introduction */}
      <section className="fade-in">
        <CourseIntroCard course={course} />
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Study Materials */}
      <section className="slide-up" style={{ animationDelay: "100ms" }}>
        <StudyMaterialSection courseId={courseId} course={course} />
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Chapter List */}
      <section className="slide-up" style={{ animationDelay: "200ms" }}>
        <ChapterList course={course} />
      </section>

      {/* Study Tips */}
      <section className="slide-up" style={{ animationDelay: "300ms" }}>
        <StudyTips />
      </section>
    </div>
  );
}

export default Course;
