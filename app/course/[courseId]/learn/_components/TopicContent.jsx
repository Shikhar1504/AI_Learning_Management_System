"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCcw, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

function TopicContent({ topic, onGenerate, loading }) {
  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="p-4 rounded-full bg-primary/10">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Select a topic to start learning</h3>
        <p className="text-muted-foreground max-w-md">
          Choose a topic from the sidebar to view its content or generate new study notes.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold mb-2">{topic.topicTitle}</h1>
        <p className="text-muted-foreground text-sm">
          Chapter: <span className="font-medium text-foreground">{topic.chapterTitle}</span>
        </p>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {topic.status === "completed" && topic.notesContent ? (
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{topic.notesContent}</ReactMarkdown>
          </div>
        ) : topic.status === "generating" || loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">
              Generating your study notes with AI...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 border-2 border-dashed border-border rounded-xl bg-card/50">
            <div className="p-4 rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Ready to learn?</h3>
              <p className="text-muted-foreground max-w-sm">
                Generate comprehensive study notes for this topic using AI.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={() => onGenerate(topic.id)}
              disabled={loading}
              className="group"
            >
              {loading ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2 group-hover:text-yellow-300 transition-colors" />
                  Generate Notes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TopicContent;
