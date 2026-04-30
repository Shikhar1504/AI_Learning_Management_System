"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Target, Brain } from "lucide-react";

export default function WeakAreasListPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [courseTitles, setCourseTitles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/remedial/all");
        if (!res.ok) throw new Error("Failed to fetch remedial content");
        const payload = await res.json();
        const data = payload?.data ?? [];

        if (mounted) {
          if (Array.isArray(data)) {
            setItems(data);
          } else {
            setItems(data ? [data] : []);
          }
        }
      } catch (err) {
        console.error("WeakAreas fetch error:", err);
        if (mounted) setError("Failed to load weak areas");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;

    const courseIds = [
      ...new Set(
        items
          .map((item) => item?.metadata?.courseId)
          .filter(Boolean),
      ),
    ];

    if (courseIds.length === 0) return;

    let mounted = true;
    (async () => {
      try {
        const entries = await Promise.all(
          courseIds.map(async (cid) => {
            try {
              const res = await fetch(`/api/courses?courseId=${cid}`);
              if (!res.ok) return [cid, "Course"];
              const payload = await res.json();
              return [cid, payload?.data?.topic || "Course"];
            } catch {
              return [cid, "Course"];
            }
          }),
        );

        if (mounted) {
          setCourseTitles(Object.fromEntries(entries));
        }
      } catch (err) {
        console.error("Course title list fetch error:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [items]);

  const handleCardClick = (courseId) => {
    router.push(`/weak-areas/${courseId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">
        <header>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-display text-white">
                  Weak Areas Analysis
                </h1>
                <p className="text-lg text-slate-400">
                  Targeted remediation based on your quiz performance
                </p>
              </div>
            </div>
            {items.length > 0 && (
               <div className="flex items-center gap-2 bg-[#111623]/80 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-xl shadow-lg">
                  <Brain className="h-5 w-5 text-teal-400" />
                  <span className="text-white font-medium">{items.length} Areas Identified</span>
               </div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="bg-[#111623]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/5 text-center shadow-xl">
              <div className="h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-lg font-medium text-slate-300">Analyzing your weak areas...</div>
          </div>
        ) : error ? (
          <div className="bg-[#111623]/80 backdrop-blur-xl p-8 rounded-3xl border border-red-500/20 text-center shadow-xl">
              <div className="text-lg font-medium text-red-400">{error}</div>
          </div>
        ) : items.length === 0 ? (
           <div className="bg-[#111623]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden group mt-10">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(20,184,166,0.15)] relative z-10 transition-transform group-hover:scale-110 duration-500">
                 <Brain className="h-12 w-12 text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 relative z-10 font-display">You&apos;re All Caught Up!</h3>
              <p className="text-slate-400 text-lg relative z-10">Take more practice quizzes to identify potential areas for improvement.</p>
           </div>
        ) : (
           <div className="space-y-8">
              {/* Summary Section (Top) */}
              <div className="grid sm:grid-cols-3 gap-6">
                 <div className="bg-[#111623]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex items-center gap-4 hover:-translate-y-1 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="p-4 bg-teal-500/10 rounded-2xl border border-teal-500/20 relative z-10 group-hover:scale-105 transition-transform duration-300">
                       <Target className="h-6 w-6 text-teal-400" />
                    </div>
                    <div className="relative z-10">
                       <div className="text-sm text-slate-400 font-medium mb-1">Total Weak Areas</div>
                       <div className="text-2xl font-bold text-white font-display">{items.length}</div>
                    </div>
                 </div>
                 
                 <div className="bg-[#111623]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex items-center gap-4 hover:-translate-y-1 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="p-4 bg-teal-500/10 rounded-2xl border border-teal-500/20 relative z-10 group-hover:scale-105 transition-transform duration-300">
                       <Brain className="h-6 w-6 text-teal-400" />
                    </div>
                    <div className="relative z-10">
                       <div className="text-sm text-slate-400 font-medium mb-1">Average Score</div>
                       <div className="text-2xl font-bold text-white font-display">
                          {items.length > 0 ? Math.round(items.reduce((acc, item) => acc + (item?.metadata?.percentage || 0), 0) / items.length) : 0}%
                       </div>
                    </div>
                 </div>

                 <div className="bg-[#111623]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex items-center gap-4 hover:-translate-y-1 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="p-4 bg-teal-500/10 rounded-2xl border border-teal-500/20 relative z-10 group-hover:scale-105 transition-transform duration-300">
                       <Target className="h-6 w-6 text-teal-400" />
                    </div>
                    <div className="relative z-10">
                       <div className="text-sm text-slate-400 font-medium mb-1">Needs Review</div>
                       <div className="text-2xl font-bold text-white font-display">
                          {items.filter(item => (item?.metadata?.percentage || 0) < 50).length} Topics
                       </div>
                    </div>
                 </div>
              </div>

              {/* Main Content (List) */}
              <div>
                 <h2 className="text-xl font-bold text-white mb-6">Topics to Master</h2>
                 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, idx) => {
                       const metadata = item?.metadata || {};
                       const content = item?.content || {};
                       const topicsCount = (content.targetTopics || []).length;
                       const courseTitle = courseTitles[metadata.courseId] || "Course";

                       return (
                         <div
                           key={idx}
                           className="bg-[#111623]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 cursor-pointer hover:-translate-y-1 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
                           onClick={() => handleCardClick(metadata.courseId)}
                         >
                           <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                           <div className="space-y-4 flex-1 relative z-10">
                             <div className="flex items-start justify-between gap-3">
                               <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors line-clamp-2 leading-tight">
                                 {content.remediationTitle || "Remediation"}
                               </h3>
                               {metadata.percentage !== undefined && (
                                 <div className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold whitespace-nowrap shadow-sm">
                                   {metadata.percentage}%
                                 </div>
                               )}
                             </div>
                             
                             <div className="space-y-2">
                                <p className="text-sm text-slate-400 line-clamp-1">
                                  <span className="text-slate-500 font-medium">Course:</span> {courseTitle}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {metadata.createdAt ? format(new Date(metadata.createdAt), "PPP") : ""}
                                </p>
                             </div>
                           </div>
                           
                           <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                             <div className="flex items-center gap-2 text-sm text-slate-400">
                               <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-teal-500/10 transition-colors">
                                 <Brain className="h-4 w-4 text-teal-400" />
                               </div>
                               <span className="font-medium text-white">{topicsCount}</span> weak topics
                             </div>
                             <div className="text-sm font-semibold text-teal-400 group-hover:text-teal-300 flex items-center gap-1 transition-colors bg-teal-500/10 px-3 py-1.5 rounded-lg group-hover:bg-teal-500/20">
                               Review <span className="group-hover:translate-x-1 transition-transform">-&gt;</span>
                             </div>
                           </div>
                         </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        )}
      </div>
    </DashboardLayout>
  );
}
