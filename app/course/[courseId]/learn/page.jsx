"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Menu, X } from "lucide-react";
import CourseSidebar from "./_components/CourseSidebar";
import TopicContent from "./_components/TopicContent";
import { toast } from "sonner";

function TopicLearning() {
  const { courseId } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const GetCourseAndTopics = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch Course
      const courseResp = await axios.get("/api/courses?courseId=" + courseId);
      const courseData = courseResp.data.data;
      setCourse(courseData);

      // Fetch Topics (We need a way to get topics, we'll use a new/existing API or filter from course layout if topics endpoint isn't ready.
      // ideally we should have an endpoint to get topics by courseId.
      // For now, let's assume we can get topics from the course layout or a specific endpoint.
      // implementation plan didn't specify a GET topics endpoint,
      // so we might need to fetch them directly from DB via a server action or API.
      // Let's use a simple POST to a new endpoint or reusing existing structure)

      // WAIT: We need to fetch topics to know their status!
      // Let's assume we create a simple GET route or use a server action.
      // For speed, let's add a GET handler to `api/generate-topic-notes` to list topics?
      // No, let's keep it clean. Let's assume we act as if we have it or fetch it here.
      // Re-reading plan: "Sidebar: Lists chapters and topics... ordered by chapterIndex/topicIndex"
      // We need to fetch the topics from TOPIC_TABLE.

      const topicsResp = await axios.get(`/api/courses/${courseId}/topics`);
      setTopics(topicsResp.data.topics);

      // Set initial active topic (first one)
      if (topicsResp.data.topics?.length > 0) {
        setActiveTopic(topicsResp.data.topics[0]);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("Failed to load course content");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      GetCourseAndTopics();
    }
  }, [courseId, GetCourseAndTopics]);

  // Fetch content when active topic changes
  const activeTopicId = activeTopic?.id;
  const activeTopicStatus = activeTopic?.status;
  const activeTopicContent = activeTopic?.notesContent;

  useEffect(() => {
    const fetchContent = async () => {
      if (!activeTopicId) return;

      // If content is already present or status is not completed/generating, skip fetch
      if (activeTopicContent || activeTopicStatus !== "completed") return;

      try {
        setLoading(true); // Re-use loading state for content fetch or create a new one if refined UI needed
        const result = await axios.get(`/api/topics/${activeTopicId}`);

        // Update active topic with content
        setActiveTopic((prev) => ({
          ...prev,
          notesContent: result.data.content,
        }));

        // Also update in topics list to cache it
        setTopics((prevTopics) =>
          prevTopics.map((t) =>
            t.id === activeTopicId
              ? { ...t, notesContent: result.data.content }
              : t,
          ),
        );
      } catch (error) {
        console.error("Error fetching topic content:", error);
        toast.error("Failed to load topic content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [activeTopicContent, activeTopicId, activeTopicStatus]);

  const handleGenerateNotes = async (topicId) => {
    try {
      setGenerating(true);
      const result = await axios.post("/api/generate-topic-notes", {
        topicId: topicId,
      });

      if (result.data?.content) {
        // Update local state
        const updatedTopics = topics.map((t) => {
          if (t.id === topicId) {
            return {
              ...t,
              status: "completed",
              notesContent: result.data.content,
            };
          }
          return t;
        });
        setTopics(updatedTopics);

        // Update active topic if it's the one we just generated
        if (activeTopic?.id === topicId) {
          setActiveTopic({
            ...activeTopic,
            status: "completed",
            notesContent: result.data.content,
          });
        }

        toast.success("Notes generated successfully!");
        router.refresh();
      }
    } catch (error) {
      console.error("Error generating notes:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Failed to generate notes. Please try again.";
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !course) {
    // Only show full screen loader if course is not loaded
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {/* Sidebar (Desktop) */}
      <CourseSidebar
        course={course}
        topics={topics}
        activeTopic={activeTopic}
        setActiveTopic={setActiveTopic}
        className="hidden md:block"
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative flex-1 w-full max-w-xs bg-background h-full shadow-2xl animate-in slide-in-from-left duration-200 border-r border-border">
            <div className="absolute top-3 right-3 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CourseSidebar
              course={course}
              topics={topics}
              activeTopic={activeTopic}
              setActiveTopic={(t) => {
                setActiveTopic(t);
                setIsSidebarOpen(false);
              }}
              className="w-full border-r-0 mt-8"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar for Mobile/Navigation */}
        <div className="p-4 border-b border-border flex items-center gap-3 bg-card/50 backdrop-blur-sm">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href={`/course/${courseId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course Status
            </Button>
          </Link>
          {/* Mobile sidebar trigger could go here */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <TopicContent
            topic={activeTopic}
            onGenerate={handleGenerateNotes}
            loading={generating}
          />
        </div>
      </div>
    </div>
  );
}

export default TopicLearning;
