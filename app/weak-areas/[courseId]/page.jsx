"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

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
        <header>
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to weak areas
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {data?.remediationTitle || "Remediation"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {courseTitle ? `Course: ${courseTitle}` : "Course"}
                {data?.createdAt
                  ? ` • ${format(new Date(data.createdAt), "PPP")}`
                  : ""}
              </p>
            </div>
            {data?.percentage !== undefined && (
              <Badge className="text-base">Score: {data.percentage}%</Badge>
            )}
          </div>
        </header>

        {loading ? (
          <Card className="p-5 rounded-xl border border-white/10">
            <CardHeader>
              <CardTitle>Loading remediation content…</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Please wait</div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="p-5 rounded-xl border border-white/10">
            <CardHeader>
              <CardTitle>Unable to load</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-red-400">{error}</div>
            </CardContent>
          </Card>
        ) : !data ? (
          <Card className="p-5 rounded-xl border border-white/10">
            <CardContent>
              <div className="text-sm text-muted-foreground">
                No remediation content found
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Weak Topics Section */}
            {(data.targetTopics || []).length > 0 && (
              <Card className="p-5 rounded-xl border border-white/10">
                <CardHeader>
                  <CardTitle>Topics to Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(data.targetTopics || []).map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span className="text-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Study Plan Section */}
            {(data.studyPlan || []).length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Study Plan
                </h2>
                <div className="space-y-4">
                  {(data.studyPlan || []).map((plan, i) => (
                    <Card
                      key={i}
                      className={`p-5 rounded-xl border transition-colors ${
                        completedItems[i]
                          ? "border-green-500/50 bg-green-500/5"
                          : "border-white/10"
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {plan.topic}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              Practice Question
                            </p>
                          </div>
                          {completedItems[i] && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="border-t border-white/10 pt-4">
                          <h4 className="text-sm font-semibold text-foreground mb-3">
                            Practice Question
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {plan.practiceQuestion}
                          </p>

                          <textarea
                            placeholder="Type your answer here…"
                            value={userAnswers[i] || ""}
                            onChange={(e) =>
                              handleAnswerChange(i, e.target.value)
                            }
                            className="w-full p-3 bg-background border border-white/10 rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-white/20"
                            rows={3}
                          />

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleRevealAnswer(i)}
                            >
                              {revealedAnswers[i]
                                ? "Hide Answer"
                                : "Reveal Answer"}
                            </Button>
                            {revealedAnswers[i] && (
                              <Button
                                size="sm"
                                onClick={() => markAsComplete(i)}
                                className={
                                  completedItems[i]
                                    ? "bg-green-600 hover:bg-green-700"
                                    : ""
                                }
                              >
                                {completedItems[i]
                                  ? "✓ Completed"
                                  : "Mark as Done"}
                              </Button>
                            )}
                          </div>

                          {revealedAnswers[i] && (
                            <>
                              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <div className="text-xs font-semibold text-blue-400 mb-1">
                                  CORRECT ANSWER
                                </div>
                                <div className="text-sm text-foreground">
                                  {plan.answer}
                                </div>
                              </div>

                              <div className="mt-3">
                                <h4 className="text-sm font-semibold text-foreground mb-2">
                                  Explanation
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {plan.explanation}
                                </p>
                              </div>

                              {(plan.keyPoints || []).length > 0 && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-semibold text-foreground mb-2">
                                    Key Points
                                  </h4>
                                  <ul className="space-y-1">
                                    {(plan.keyPoints || []).map((kp, k) => (
                                      <li
                                        key={k}
                                        className="flex gap-2 text-sm text-muted-foreground"
                                      >
                                        <span className="text-blue-400">✓</span>
                                        <span>{kp}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
