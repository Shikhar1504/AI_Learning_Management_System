"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  RefreshCcw,
  Play,
  Zap,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

import { useStudyStatus } from "@/hooks/useStudyStatus";

function MaterialCardItem({
  item,
  studyTypeContent,
  course,
  refreshData,
  loading: globalLoading,
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const Icon = item.icon;

  // Use custom hook for status polling
  // Only active for flashcard and quiz types
  const shouldPoll = item.type === "flashcard" || item.type === "quiz";
  const { status, isGenerating, isCompleted, isFailed, errorMessage, setStatus } =
    useStudyStatus(
      shouldPoll ? course?.courseId : null,
      shouldPoll ? item.type : null,
    );

  // Effect to handle completion
  // Track previous status to prevent repeated toasts
  const prevStatusRef = useRef(status);

  // Effect to handle completion
  useEffect(() => {
    // Only trigger if transitioning from generating to completed
    if (prevStatusRef.current === "generating" && status === "completed") {
      const fetchData = async () => {
        await refreshData();
        toast({
          title: "Content Ready! 🎉",
          description: `Your ${item.name.toLowerCase()} are ready to use.`,
        });
      };
      fetchData();
    }

    // Update ref with current status
    prevStatusRef.current = status;
  }, [status, item.name, refreshData, toast]);

  // Effect to handle failure
  useEffect(() => {
    if (isFailed) {
      toast({
        title: "Generation Failed",
        description: errorMessage || "Please try again or contact support.",
        variant: "destructive",
      });
    }
  }, [isFailed, errorMessage, toast]);

  // Get the actual content for this item type
  const getItemContent = () => {
    if (!studyTypeContent) return null;

    // Handle different type mappings
    const typeKey =
      item.type === "flashcard"
        ? "flashcard"
        : item.type === "quiz"
          ? "quiz"
          : item.type;

    return studyTypeContent[typeKey] || studyTypeContent[item.type] || null;
  };

  const itemContent = getItemContent();
  const hasContent =
    itemContent && Array.isArray(itemContent) && itemContent.length > 0;

  // Use content presence as the primary source of truth for "Ready" state
  // This prevents showing "Ready" with 0 items while fetching
  const isGenerated = hasContent;

  // Calculate item count based on content type
  const getItemCount = () => {
    // If not generated or no content available, return 0
    if (!hasContent) return 0;

    // For quiz content, check if items have questions property or are direct questions
    if (item.type === "quiz") {
      // If the content array contains objects with 'questions' property, count those
      if (
        itemContent[0] &&
        itemContent[0].questions &&
        Array.isArray(itemContent[0].questions)
      ) {
        return itemContent[0].questions.length;
      }
      // Otherwise, count the items directly (they are individual questions)
      return itemContent.length;
    }

    // For other types (flashcards, notes), count directly
    return itemContent.length;
  };

  const itemCount = getItemCount();

  // Combined processing state:
  // 1. Local loading (triggering generation)
  // 2. Global loading (fetching initial data)
  // 3. Hook generating state (polling)
  // 4. Syncing state (Status is completed but content not yet verified/loaded)
  const isSyncing = status === "completed" && !hasContent;
  const isProcessing = loading || globalLoading || isGenerating || isSyncing;

  // Get appropriate image for each material type
  const getImageForType = (type) => {
    switch (type) {
      case "notes":
        return "/notes.png";
      case "flashcard":
        return "/flashcard.png";
      case "quiz":
        return "/quiz.png";
      default:
        return "/content.png"; // fallback image
    }
  };

  const GenerateContent = async () => {
    setLoading(true);

    try {
      const chapters = course?.courseLayout?.chapters || [];

      await axios.post("/api/study-type-content", {
        courseId: course?.courseId,
        type: item.type,
        chapters: chapters,
      });

      toast({
        title: "Generation Started! 🚀",
        description: `Your ${item.name.toLowerCase()} are being generated. This may take a moment.`,
      });

      // Manually set status to generating to trigger the hook's polling
      setStatus("generating");
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative h-full min-h-[420px] rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden transition-all duration-500 shadow-[0_0_30px_rgba(6,182,212,0.08)] hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:-translate-y-2">
      {/* Gradient Border via Pseudo-element */}
      <div
        className={`absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        style={{
          maskImage:
            "linear-gradient(black, black) content-box, linear-gradient(black, black)",
          maskComposite: "exclude",
        }}
      />

      {/* Subtle Background Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      <div className="relative p-6 h-full flex flex-col z-10">
        {/* Status Badge */}
        <div className="flex items-center justify-center mb-8">
          <div
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all duration-300 ${
              isGenerated || item.type === "notes"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20"
                : "bg-orange-500/10 text-orange-400 border-orange-500/20 group-hover:bg-orange-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {isGenerated || item.type === "notes" ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3 animate-pulse" />
              )}
              <span>
                {isGenerated || item.type === "notes"
                  ? "Ready"
                  : "Not Generated"}
              </span>
            </div>
          </div>
        </div>

        {/* Icon & Content */}
        <div className="flex-1 flex flex-col items-center text-center space-y-6">
          {/* Material Image */}
          <div
            className={`relative p-5 rounded-3xl bg-gradient-to-br ${item.bgGradient} group-hover:scale-105 transition-all duration-500 shadow-xl group-hover:shadow-2xl ring-1 ring-white/10 group-hover:ring-white/20`}
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <Image
                src={getImageForType(item.type)}
                alt={item.name}
                width={80}
                height={80}
                className="object-contain filter drop-shadow-md group-hover:drop-shadow-xl transition-all duration-500 transform group-hover:rotate-3 group-hover:scale-110"
              />
            </div>

            {/* Glow effect */}
            <div
              className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-700`}
            />
          </div>

          {/* Title & Description */}
          <div className="space-y-3 px-2">
            <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-cyan-300 group-hover:to-blue-300 transition-all duration-500">
              {item.name}
            </h3>
            <p className="text-sm text-white/50 leading-relaxed font-light">
              {item.desc}
            </p>
          </div>

          {/* Content Stats */}
          {isGenerated && (
            <div className="w-full pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm md:text-xs">
                {item.type === "flashcard" && (
                  <span className="text-cyan-300">🃏 {itemCount} Cards</span>
                )}
                {item.type === "quiz" && (
                  <span className="text-green-300">
                    ❓ {itemCount} Questions
                  </span>
                )}
                {item.type === "notes" && (
                  <span className="text-blue-300">📝 {itemCount} Chapters</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8">
          {isGenerated || item.type === "notes" ? (
            <Link
              href={`/course/${course?.courseId}${item.path}`}
              className="block w-full"
            >
              <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-cyan-500 hover:to-blue-500 text-white border border-white/10 hover:border-transparent transition-all duration-300 group-hover:shadow-lg group-hover:shadow-cyan-500/20">
                <span className="font-semibold tracking-wide mr-2 group-hover:mr-3 transition-all">
                  Start Learning
                </span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full h-12 rounded-xl btn-secondary border-white/10 hover:bg-white/10 transition-all duration-300"
              onClick={GenerateContent}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin text-orange-400" />
                  <span className="text-orange-400">
                    {isSyncing ? "Finalizing..." : "Generating..."}
                  </span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2 text-yellow-400 group-hover:text-white transition-colors" />
                  <span className="group-hover:text-white transition-colors">
                    Generate Content
                  </span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaterialCardItem;
