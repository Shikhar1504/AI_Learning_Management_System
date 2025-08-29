import React, { useEffect, useState } from "react";
import MaterialCardItem from "./MaterialCardItem";
import axios from "axios";
import { Brain, FileText, HelpCircle, Layers, Sparkles } from "lucide-react";

function StudyMaterialSection({ courseId, course }) {
  const [studyTypeContent, setStudyTypeContent] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const MaterialList = [
    {
      name: "Course Notes",
      desc: "Comprehensive study notes with detailed explanations and examples",
      icon: FileText,
      path: "/notes",
      type: "notes",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10"
    },
    {
      name: "Smart Flashcards",
      desc: "Interactive flashcards with spaced repetition for better retention",
      icon: Layers,
      path: "/flashcards",
      type: "flashcard",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10"
    },
    {
      name: "Knowledge Quiz",
      desc: "Test your understanding with AI-generated questions and instant feedback",
      icon: HelpCircle,
      path: "/quiz",
      type: "quiz",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10"
    }
  ];

  useEffect(() => {
    if (courseId) {
      GetStudyMaterial();
    }
  }, [courseId]);

  const GetStudyMaterial = async () => {
    try {
      setLoading(true);
      const result = await axios.post("/api/study-type", {
        courseId: courseId,
        studyType: "ALL",
      });
      setStudyTypeContent(result.data);
    } catch (error) {
      console.error("Failed to fetch study materials:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Brain className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground font-display">Study Materials</h2>
          </div>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose your preferred learning method to master the content. Each method is designed to help you learn effectively.
        </p>
      </div>

      {/* Material Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {MaterialList.map((item, index) => (
          <div 
            key={index}
            className="fade-in"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <MaterialCardItem
              item={item}
              studyTypeContent={studyTypeContent}
              course={course}
              refreshData={GetStudyMaterial}
              loading={loading}
            />
          </div>
        ))}
      </div>

      {/* Enhanced Study Tips */}
      <div className="modern-card p-8 border border-white/10 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Pro Learning Tips</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <h4 className="font-semibold text-foreground">1. Start with Notes</h4>
              <p className="text-sm text-muted-foreground">
                Build a solid foundation by reading through comprehensive notes first
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto">
                <Layers className="h-6 w-6 text-purple-400" />
              </div>
              <h4 className="font-semibold text-foreground">2. Practice with Flashcards</h4>
              <p className="text-sm text-muted-foreground">
                Reinforce memory using spaced repetition techniques for better retention
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto">
                <HelpCircle className="h-6 w-6 text-green-400" />
              </div>
              <h4 className="font-semibold text-foreground">3. Test with Quizzes</h4>
              <p className="text-sm text-muted-foreground">
                Validate your understanding and identify areas that need more focus
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyMaterialSection;