"use client";
import { useState } from "react";
import { CourseCountContext } from "../_context/CourseCountContext";
import DashboardHeader from "./_components/DashboardHeader";
import SideBar from "./_components/SideBar";
{
  /*this wrap the entire dashboard*/
}
function DashboardLayout({ children }) {
  const [totalCourse, setTotalCourse] = useState(0);

  {
    /* By wrapping your component tree in the CourseCountContext.Provider, 
    every child component within that layout can access the same context value. 
    This means that if one component updates totalCourse using 
    setTotalCourse (update in getCourseList inside CourseList), 
    all other components that consume the context will receive the updated value.*/
  }
  return (
    <CourseCountContext.Provider value={{ totalCourse, setTotalCourse }}>
      <div>
        <div className="md:w-64 hidden md:block fixed">
          <SideBar />
        </div>
        <div className="md:ml-64">
          <DashboardHeader />
          <div className="p-10">{children}</div>
        </div>
      </div>
    </CourseCountContext.Provider>
  );
}

export default DashboardLayout;
