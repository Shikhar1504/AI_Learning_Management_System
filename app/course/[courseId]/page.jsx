"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import CourseIntroCard from "./_components/CourseIntroCard";
import StudyMaterialSection from "./_components/StudyMaterialSection";
import ChapterList from "./_components/ChapterList";
import axios from "axios";

function Course() {
  const { courseId } = useParams();
  const [course, setCourse] = useState();

  useEffect(() => {
    if (courseId) GetCourse(); // Only call when courseId is available
  }, [courseId]); // Run when courseId changes

  const GetCourse = async () => {
    try {
      const result = await axios.get("/api/courses?courseId=" + courseId);
      console.log(result);
      setCourse(result.data.result);
    } catch (error) {
      console.error("Error fetching course:", error);
    }
  };
  return (
    <div>
      <div className="">
        {/* Course Intro  */}
        <CourseIntroCard course={course} />
        {/* Study Materials Options  */}
        <StudyMaterialSection courseId={courseId} course={course} /> 
        {/* Chapter List  */}
        <ChapterList course={course} />
        {/* <ChapterList course={course} /> */}
      </div>
    </div>
  );
}

export default Course;