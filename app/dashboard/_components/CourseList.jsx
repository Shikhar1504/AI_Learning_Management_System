"use client";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import CourseCardItem from "./CourseCardItem";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { CourseCountContext } from "@/app/_context/CourseCountContext";

function CourseList() {
  const { user } = useUser();
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { totalCourse, setTotalCourse } = useContext(CourseCountContext);

  //useEffect will call GetCourseList whenever user changes
  //useEffect executes after the initial render or when dependencies change, which makes sense only in a client-side environment.
  useEffect(() => {
    user && GetCourseList();
  }, [user]);

  const GetCourseList = async () => {
    setLoading(true);
    const result = await axios.post("/api/courses", {
      createdBy: user?.primaryEmailAddress?.emailAddress,
    });
    console.log(result);
    setCourseList(result.data.result); // takes the array of courses returned from the API and updates the state so that each course is stored as a separate item inside the courseList array.
    setTotalCourse(result.data.result.length);
    setLoading(false);
  };
  return (
    <div className="mt-10">
      <h2 className="font-bold text-2xl flex justify-between items-center">
        📚 Enhance Your Learning Experience
        <Button
          variant="outline"
          onClick={GetCourseList}
          className="border-primary text-primary"
        >
          {" "}
          <RefreshCw /> Refresh
        </Button>
      </h2>

      {/*If loading == false → Render the real course list.
        If loading == true → Render six gray "skeleton" boxes (<div> with animate-pulse).*/}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 mt-2 gap-5">
        {loading == false
          ? courseList?.map((course, index) => (
              <CourseCardItem course={course} key={index} />
            ))
          : [1, 2, 3, 4, 5, 6].map((item, index) => (
              <div
                key={index}
                className="h-56 w-full bg-slate-200 rounded-lg animate-pulse"
              ></div>
            ))}
      </div>
    </div>
  );
}

export default CourseList;
