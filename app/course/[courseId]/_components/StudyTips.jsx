import React from "react";
import { Sparkles, FileText, Layers, HelpCircle } from "lucide-react";

function StudyTips() {
  return (
    <div className="modern-card p-8 border border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-xl bg-orange-500/10">
            <Sparkles className="h-6 w-6 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-white font-display">
            Maximize Your Learning
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <h4 className="font-semibold text-white mb-2">
              1. Master the Basics
            </h4>
            <p className="text-sm text-white/60 leading-relaxed">
              Start with course notes to build a strong conceptual foundation
              before diving into practice.
            </p>
          </div>

          <div className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Layers className="h-6 w-6 text-purple-400" />
            </div>
            <h4 className="font-semibold text-white mb-2">2. Active Recall</h4>
            <p className="text-sm text-white/60 leading-relaxed">
              Use smart flashcards to test your memory and reinforce key
              concepts through spaced repetition.
            </p>
          </div>

          <div className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <HelpCircle className="h-6 w-6 text-green-400" />
            </div>
            <h4 className="font-semibold text-white mb-2">
              3. Validate Knowledge
            </h4>
            <p className="text-sm text-white/60 leading-relaxed">
              Take the AI-generated quiz to identify knowledge gaps and ensure
              you&apos;re ready to move forward.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyTips;
