"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Target, Brain } from "lucide-react";

export default function RemediationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;

  const [data, setData] = useState(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [completedItems, setCompletedItems] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/remedial/all?courseId=${courseId}`);
        if (!res.ok) throw new Error("Failed to fetch remedial content");
        const payload = await res.json();
        const responseData = payload?.data ?? null;

        if (!responseData) {
          if (mounted) setData(null);
          return;
        }

        const metadata = responseData.metadata || {};
        const content = responseData.content || {};

        const combined = {
          ...content,
          percentage: metadata.percentage,
          courseId: metadata.courseId,
          createdAt: metadata.createdAt,
        };

        if (mounted) setData(combined);
      } catch (err) {
        console.error("Remedial detail fetch error:", err);
        if (mounted) setError("Failed to load remediation content");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;

    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/courses?courseId=${courseId}`);
        if (!res.ok) return;
        const payload = await res.json();
        const title = payload?.data?.topic || "";
        if (mounted) setCourseTitle(title);
      } catch (err) {
        console.error("Course title fetch error:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const handleAnswerChange = (idx, value) => {
    setUserAnswers((prev) => ({ ...prev, [idx]: value }));
  };

  const toggleRevealAnswer = (idx) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const markAsComplete = (idx) => {
    setCompletedItems((prev) => ({ ...prev, [idx]: true }));
  };

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/weak-areas");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to weak areas
          </button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display text-white mb-2">
                {data?.remediationTitle || "Remediation"}
              </h1>
              <p className="text-slate-400 text-lg">
                {courseTitle ? `Course: ${courseTitle}` : "Course"}
                {data?.createdAt
                  ? ` • ${format(new Date(data.createdAt), "PPP")}`
                  : ""}
              </p>
            </div>
            {data?.percentage !== undefined && (
              <div className="bg-[#111623]/80 backdrop-blur-xl border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-xl">
                <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                   <Target className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                   <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Overall Score</div>
                   <div className="text-2xl font-bold text-white font-display leading-none">{data.percentage}%</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="bg-[#111623]/80 backdrop-blur-xl p-12 rounded-3xl border border-white/5 text-center shadow-xl">
              <div className="h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-lg font-medium text-slate-300">Loading your personalized study plan...</div>
          </div>
        ) : error ? (
          <div className="bg-[#111623]/80 backdrop-blur-xl p-8 rounded-3xl border border-red-500/20 text-center shadow-xl">
              <div className="text-lg font-medium text-red-400">{error}</div>
          </div>
        ) : !data ? (
          <div className="bg-[#111623]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/5 text-center shadow-xl">
              <div className="text-lg font-medium text-slate-400">No remediation content found</div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Weak Topics Section */}
            {/* Weak Topics Section */}
            {(data.targetTopics || []).length > 0 && (
              <div className="bg-[#111623]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10 font-display">
                  <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                    <Target className="h-5 w-5 text-teal-400" />
                  </div>
                  Key Topics to Review
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                  {(data.targetTopics || []).map((t, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-default">
                      <div className="h-2 w-2 rounded-full bg-teal-400 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                      <span className="text-slate-200 text-sm font-medium">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Study Plan Section */}
            {/* Study Plan Section */}
            {(data.studyPlan || []).length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                    <Brain className="h-6 w-6 text-teal-400" />
                  </div>
                  <h2 className="text-2xl font-bold font-display text-white">Study Plan Workspaces</h2>
                </div>
                
                <div className="space-y-8">
                  {(data.studyPlan || []).map((plan, i) => {
                    const isCompleted = completedItems[i];
                    const isRevealed = revealedAnswers[i];
                    
                    return (
                      <div
                        key={i}
                        className={`bg-[#111623]/80 backdrop-blur-xl border rounded-3xl p-6 md:p-8 shadow-xl transition-all duration-500 relative overflow-hidden group ${
                          isCompleted
                            ? "border-green-500/30"
                            : "border-white/5 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)]"
                        }`}
                      >
                        <div className="absolute top-0 right-0 p-32 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none transition-all duration-500" />
                        
                        <div className="grid md:grid-cols-5 gap-8 relative z-10">
                          {/* Left Side: Question */}
                          <div className={`space-y-6 transition-all duration-500 ${isRevealed ? 'md:col-span-3' : 'md:col-span-5'}`}>
                             <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                               <div>
                                 <div className="text-xs font-bold tracking-wider text-teal-400 mb-2 uppercase flex items-center gap-2">
                                    <span className="bg-teal-500/20 px-2 py-0.5 rounded text-[10px]">Step {i + 1}</span>
                                    Practice Module
                                 </div>
                                 <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
                                   {plan.topic}
                                 </h3>
                               </div>
                               {isCompleted && (
                                 <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full border border-green-500/20 text-sm font-medium shrink-0 shadow-sm">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Mastered
                                 </div>
                               )}
                             </div>
                             
                             <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                   Question
                                </h4>
                                <p className="text-slate-200 leading-relaxed text-lg">
                                  {plan.practiceQuestion}
                                </p>
                             </div>

                             <div>
                                <textarea
                                  placeholder="Draft your answer here to test your knowledge..."
                                  value={userAnswers[i] || ""}
                                  onChange={(e) => handleAnswerChange(i, e.target.value)}
                                  className="w-full p-5 bg-[#0B0F1A] border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all resize-none shadow-inner"
                                  rows={isRevealed ? 4 : 5}
                                />
                             </div>

                             <div className="flex flex-wrap items-center gap-3 pt-2">
                               <Button
                                 onClick={() => toggleRevealAnswer(i)}
                                 className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-6 h-11"
                               >
                                 {isRevealed ? "Hide Answer & Explanation" : "Reveal Answer & Explanation"}
                               </Button>
                               {isRevealed && (
                                 <Button
                                   onClick={() => markAsComplete(i)}
                                   className={`rounded-xl px-6 h-11 transition-all ${
                                     isCompleted
                                       ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20"
                                       : "bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white border-0 shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:scale-[1.02]"
                                   }`}
                                 >
                                   {isCompleted ? "Mark as Incomplete" : "Mark as Mastered"}
                                 </Button>
                               )}
                             </div>
                          </div>

                          {/* Right Side: Answer & Explanation */}
                          {isRevealed && (
                             <div className="md:col-span-2 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 md:border-l md:border-white/5 md:pl-8 pt-6 md:pt-0 border-t border-white/5 md:border-t-0">
                               <div>
                                 <div className="text-xs font-bold tracking-wider text-teal-400 mb-3 uppercase flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Correct Answer
                                 </div>
                                 <div className="text-slate-200 text-sm leading-relaxed bg-teal-500/5 border border-teal-500/10 p-5 rounded-2xl">
                                   {plan.answer}
                                 </div>
                               </div>

                               <div>
                                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Explanation</h4>
                                  <p className="text-slate-300 text-sm leading-relaxed">
                                    {plan.explanation}
                                  </p>
                               </div>

                               {(plan.keyPoints || []).length > 0 && (
                                 <div>
                                   <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Points</h4>
                                   <ul className="space-y-3">
                                     {(plan.keyPoints || []).map((kp, k) => (
                                       <li key={k} className="flex gap-3 text-sm text-slate-300 items-start">
                                         <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                                         <span className="leading-relaxed">{kp}</span>
                                       </li>
                                     ))}
                                   </ul>
                                 </div>
                               )}
                             </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
