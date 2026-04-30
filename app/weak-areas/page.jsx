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
      <div className="space-y-6">
        <header>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Your Weak Areas
              </h1>
              <p className="text-sm text-muted-foreground">
                Review and practice topics where you struggled
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <Card className="p-5 rounded-xl border border-white/10">
            <CardHeader>
              <CardTitle>Loading your weak areas...</CardTitle>
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
        ) : items.length === 0 ? (
          <Card className="p-5 rounded-xl border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Brain className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  🎯 No weak areas yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Take a quiz to identify areas for improvement
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item, idx) => {
              const metadata = item?.metadata || {};
              const content = item?.content || {};
              const topicsCount = (content.targetTopics || []).length;
              const courseTitle = courseTitles[metadata.courseId] || "Course";

              return (
                <Card
                  key={idx}
                  className="p-5 rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition-colors"
                  onClick={() => handleCardClick(metadata.courseId)}
                >
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          {content.remediationTitle || "Remediation"}
                        </CardTitle>
                        {metadata.percentage !== undefined && (
                          <Badge className="ml-2">
                            Score: {metadata.percentage}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Course: {courseTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {metadata.createdAt
                          ? format(new Date(metadata.createdAt), "PPP")
                          : ""}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {topicsCount}
                        </span>{" "}
                        weak topics
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Click to review -&gt;
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
