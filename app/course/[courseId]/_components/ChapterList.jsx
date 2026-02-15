import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, Circle } from "lucide-react";

function ChapterList({ course }) {
  const CHAPTERS = course?.courseLayout?.chapters;
  
  return (
    <div className="mt-8 space-y-5">
      <div className="flex items-center justify-between">
         <h2 className="font-bold text-2xl font-display">Course Chapters</h2>
         <span className="text-sm text-muted-foreground">{CHAPTERS?.length || 0} modules</span>
      </div>

      <div className="modern-card p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {CHAPTERS?.map((chapter, index) => {
            // Mock progress for now - in real app, derive from topic completion status
            const totalChapterTopics = chapter?.topics?.length || 0;
            // logic to find completed topics in this chapter... 
            // Since we don't have per-chapter completion status easily available without processing logic,
            // we will simulate or just show total topics.
            // For now, let's just show "X Topics" cleanly.
            
             return (
              <AccordionItem 
                 key={index} 
                 value={`item-${index}`} 
                 className="border border-white/10 rounded-xl px-4 bg-black/20 hover:bg-white/5 transition-all duration-300 data-[state=open]:bg-white/5 data-[state=open]:border-purple-500/30"
              >
                <AccordionTrigger className="hover:no-underline py-5 group">
                   <div className="flex items-center gap-5 text-left w-full">
                      <div className="flex-shrink-0 text-3xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-md">
                         {chapter?.emoji}
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center justify-between mr-4">
                            <h3 className="font-bold text-lg text-white flex items-center gap-3">
                               <span className="text-white/40 font-medium text-base">0{index + 1}</span>
                               {chapter?.chapter_title || chapter?.chapterTitle}
                            </h3>
                         </div>
                         <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs font-medium text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                               {totalChapterTopics} Topics
                            </span>
                            {/* Mobile-only summary line */}
                            <p className="text-xs text-muted-foreground line-clamp-1 md:hidden">
                              {chapter?.summary}
                            </p>
                         </div>
                      </div>
                   </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                   <div className="pl-[4.5rem] space-y-4 pr-4">
                      <p className="text-white/70 leading-relaxed text-sm">
                         {chapter?.summary}
                      </p>
                      
                      {/* Topics List as Tags */}
                      {chapter?.topics && chapter.topics.length > 0 && (
                         <div className="space-y-3 pt-2">
                             <div className="h-px w-full bg-white/5" />
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {chapter.topics.map((topic, i) => (
                                   <div key={i} className="px-3 py-2 rounded-lg bg-white/5 text-sm font-medium text-white/80 border border-white/5 flex items-center gap-2 hover:bg-white/10 transition-colors cursor-default">
                                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                      {typeof topic === 'string' ? topic : topic?.topicTitle}
                                   </div>
                                ))}
                             </div>
                         </div>
                      )}
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

export default ChapterList;
