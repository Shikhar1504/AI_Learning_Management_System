"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCcw, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

function TopicContent({ topic, onGenerate, loading }) {
  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20">
          <BookOpen className="h-12 w-12 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold">Select a topic to start learning</h3>
        <p className="text-muted-foreground max-w-md">
          Choose a topic from the sidebar to view its content or generate new study notes.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full relative z-10">
      {/* Header */}
      <div className="mb-8 border-b border-white/[0.08] pb-6">
        <h1 className="text-3xl font-bold mb-2 text-white">{topic.topicTitle}</h1>
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
            <RefreshCcw className="h-10 w-10 animate-spin text-cyan-400" />
            <p className="text-muted-foreground animate-pulse">
              Generating your study notes with AI...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 border border-white/[0.08] bg-white/[0.04] rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.08)] backdrop-blur-sm">
            <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <Sparkles className="h-8 w-8 text-cyan-400" />
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
              className="group bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
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
