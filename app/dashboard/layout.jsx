"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { CourseCountContext } from "../_context/CourseCountContext";
import DashboardHeader from "./_components/DashboardHeader";
import SideBar from "./_components/SideBar";

function DashboardLayout({ children }) {
  const [totalCourse, setTotalCourse] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      const ensureUserExists = async () => {
        try {
          await fetch("/api/ensure-user-exists", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user: {
                id: user.id,
                name: user.fullName,
                email: user.primaryEmailAddress.emailAddress,
              },
            }),
          });
        } catch (error) {
          console.error("Error ensuring user exists:", error);
        }
      };
      ensureUserExists();
    }
  }, [user]);

  return (
    <CourseCountContext.Provider value={{ totalCourse, setTotalCourse }}>
      <div className="flex h-screen bg-[#0B0F1A] text-slate-200 overflow-hidden font-sans selection:bg-purple-500/30">
        {/* Dynamic Background Match Landing Page */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        </div>

        {/* Sidebar - Mobile handled in SideBar component, Desktop fixed */}
        <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 z-30">
          <SideBar />
        </div>
        
        {/* Main Content Area */}
        <div className="flex flex-col flex-1 lg:pl-80 relative z-10">
          <DashboardHeader />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
              <div className="fade-in">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </CourseCountContext.Provider>
  );
}

export default DashboardLayout;