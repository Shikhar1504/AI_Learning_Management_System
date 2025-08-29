"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { RefreshCcw, Play, Zap, CheckCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

function MaterialCardItem({ item, studyTypeContent, course, refreshData, loading: globalLoading }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const Icon = item.icon;
  
  // Get the actual content for this item type
  const getItemContent = () => {
    if (!studyTypeContent) return null;
    
    // Handle different type mappings
    const typeKey = item.type === 'flashcard' ? 'flashcard' : 
                   item.type === 'quiz' ? 'quiz' : 
                   item.type;
    
    return studyTypeContent[typeKey] || studyTypeContent[item.type] || null;
  };
  
  const itemContent = getItemContent();
  const isGenerated = itemContent && Array.isArray(itemContent) && itemContent.length > 0;
  
  // Calculate item count based on content type
  const getItemCount = () => {
    if (!isGenerated) return 0;
    
    // For quiz content, check if items have questions property or are direct questions
    if (item.type === 'quiz') {
      // If the content array contains objects with 'questions' property, count those
      if (itemContent[0] && itemContent[0].questions && Array.isArray(itemContent[0].questions)) {
        return itemContent[0].questions.length;
      }
      // Otherwise, count the items directly (they are individual questions)
      return itemContent.length;
    }
    
    // For other types (flashcards, notes), count directly
    return itemContent.length;
  };
  
  const itemCount = getItemCount();
  const isGenerating = loading || globalLoading;
  
  // Get appropriate image for each material type
  const getImageForType = (type) => {
    switch(type) {
      case 'notes': return '/notes.png';
      case 'flashcard': return '/flashcard.png';
      case 'quiz': return '/quiz.png';
      default: return '/content.png'; // fallback image
    }
  };
  
  const GenerateContent = async () => {
    setLoading(true);
    
    try {
      const chapters = course?.courseLayout?.chapters
        ?.map((chapter) => chapter.chapter_title || chapter.chapterTitle)
        .filter(Boolean)
        .join(", ");

      await axios.post("/api/study-type-content", {
        courseId: course?.courseId,
        type: item.type,
        chapters: chapters,
      });
      
      toast({
        title: "Content Generated! 🎉",
        description: `Your ${item.name.toLowerCase()} are ready to use. Updating interface...`,
      });
      
      // Function to check and refresh data
      const checkAndRefresh = async (attempt = 1, maxAttempts = 3) => {
        console.log(`Refresh attempt ${attempt}/${maxAttempts}`);
        
        await refreshData();
        
        // Wait a moment for state to update
        setTimeout(() => {
          const currentContent = getItemContent();
          const isNowGenerated = currentContent && Array.isArray(currentContent) && currentContent.length > 0;
          
          if (!isNowGenerated && attempt < maxAttempts) {
            // If content still not showing and we have more attempts, try again
            setTimeout(() => checkAndRefresh(attempt + 1, maxAttempts), 2000);
          } else if (!isNowGenerated && attempt >= maxAttempts) {
            // If content still not showing after all attempts, reload page
            console.log('Content not detected after refreshes, reloading page...');
            window.location.reload();
          } else {
            // Content is now showing, no need to reload
            console.log('Content successfully loaded, no reload needed');
          }
        }, 1000);
      };
      
      // Start the check and refresh process
      setTimeout(() => checkAndRefresh(), 2000);
      
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
    <div className="modern-card-interactive group h-full min-h-[420px] border border-white/10 hover:border-white/20 transition-all duration-500">
      <div className="p-6 h-full flex flex-col">
        {/* Status Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
            isGenerated 
              ? "bg-green-500/20 text-green-400 border-green-500/30 shadow-green-500/10 shadow-lg"
              : "bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-orange-500/10 shadow-lg"
          }`}>
            <div className="flex items-center gap-1.5">
              {isGenerated ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span className="font-semibold">
                {isGenerated ? 'Ready' : 'Generate'}
              </span>
            </div>
          </div>
        </div>

        {/* Icon & Content */}
        <div className="flex-1 flex flex-col items-center text-center space-y-6">
          {/* Material Image */}
          <div className={`relative p-4 rounded-3xl bg-gradient-to-br ${item.bgGradient} group-hover:scale-110 transition-all duration-500 shadow-2xl`}>
            <div className="relative w-24 h-24 flex items-center justify-center">
              <Image 
                src={getImageForType(item.type)}
                alt={item.name}
                width={80}
                height={80}
                className="object-contain filter drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-500"
              />
            </div>
            
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${item.gradient} opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500`} />
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-foreground group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-500">
              {item.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed px-2">
              {item.desc}
            </p>
          </div>

          {/* Content Stats */}
          {isGenerated && (
            <div className="w-full">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Content Ready</span>
                  <span className="text-lg font-bold text-foreground">{itemCount}</span>
                </div>
                <div className="text-xs text-center">
                  {item.type === 'flashcard' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      🃏 {itemCount} flashcard{itemCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {item.type === 'quiz' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      ❓ {itemCount} question{itemCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {item.type === 'notes' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      📝 {itemCount} chapter{itemCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6">
          {isGenerated ? (
            <Link href={`/course/${course?.courseId}${item.path}`} className="block">
              <Button className="w-full btn-primary h-12 group-hover:scale-105 transition-all duration-300 text-sm font-semibold shadow-lg">
                <Play className="h-4 w-4 mr-2" />
                <span>Start Learning</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full btn-secondary h-12 border-white/20 text-sm font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
              onClick={GenerateContent}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  <span>Generate</span>
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
