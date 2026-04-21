"use client";
// Force recompile
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

function CourseSidebar({
  course,
  topics,
  activeTopic,
  setActiveTopic,
  className,
}) {
  // Group topics by chapter
  const chapters = course?.courseLayout?.chapters || [];

  // Helper to get topics for a chapter
  const getChapterTopics = (chapterIndex) => {
    return topics
      .filter((t) => t.chapterIndex === chapterIndex)
      .sort((a, b) => a.topicIndex - b.topicIndex);
  };

  return (
    <div
      className={cn(
        "h-full border-r border-border bg-card/30 backdrop-blur-sm overflow-y-auto w-80 flex-shrink-0",
        className,
      )}
    >
      <div className="p-6 border-b border-border">
        <h2 className="font-bold text-lg line-clamp-2">
          {course?.courseLayout?.courseTitle || course?.topic}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Course Content</p>
      </div>

      <div className="p-4">
        <Accordion
          type="multiple"
          defaultValue={chapters.map((_, i) => `item-${i}`)}
          className="w-full space-y-4"
        >
          {chapters.map((chapter, index) => {
            const chapterTopics = getChapterTopics(index);

            return (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-none"
              >
                <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-accent/50 group">
                  <div className="flex items-start text-left gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {chapter.emoji || chapter.emoji_icon || "📘"}
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm">
                        {chapter.title ||
                          chapter.chapterTitle ||
                          chapter.chapter_title ||
                          `Chapter ${index + 1}`}
                      </h4>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">
                        {chapterTopics.length} topics
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0 pl-4">
                  <div className="space-y-1 relative border-l-2 border-border ml-3 pl-3">
                    {chapterTopics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => {
                          // Check if we already have the cached version with content in `topics`
                          // But here `topic` comes from `topics` passed to sidebar.
                          // If `topics` in parent is updated with content, this `topic` should have it?
                          // Yes, getChapterTopics filters from `topics`.
                          setActiveTopic(topic);
                        }}
                        className={cn(
                          "flex items-center gap-3 w-full text-left p-2 rounded-md text-sm transition-all relative",
                          activeTopic?.id === topic.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        )}
                      >
                        {topic.status === "completed" ? (
                          <CheckCircle
                            className={cn(
                              "h-4 w-4 flex-shrink-0",
                              activeTopic?.id === topic.id
                                ? "text-primary"
                                : "text-green-500/70",
                            )}
                          />
                        ) : topic.status === "generating" ? (
                          <Circle className="h-4 w-4 flex-shrink-0 animate-pulse text-yellow-500" />
                        ) : (
                          <Circle className="h-4 w-4 flex-shrink-0 opacity-50" />
                        )}
                        <span className="line-clamp-1">{topic.topicTitle}</span>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

export default CourseSidebar;
