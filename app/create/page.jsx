"use client";
import React, { useState } from "react";
import SelectOption from "./_components/SelectOption";
import TopicInput from "./_components/TopicInput";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
const { v4: uuidv4 } = require("uuid");
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  BookOpen,
  Target,
  Zap,
  CheckCircle
} from "lucide-react";

function Create() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const steps = [
    {
      id: 0,
      title: "Choose Study Type",
      description: "Select the type of learning material you want to create",
      icon: BookOpen
    },
    {
      id: 1,
      title: "Course Details",
      description: "Provide topic and difficulty level for your course",
      icon: Target
    }
  ];

  const handleUserInput = (fieldName, fieldValue) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: fieldValue,
    }));
  };

  const GenerateCourseOutline = async () => {
    const courseId = uuidv4();
    setLoading(true);

    try {
      const result = await axios.post("/api/generate-course-outline", {
        courseId: courseId,
        ...formData,
        createdBy: user?.primaryEmailAddress?.emailAddress,
      });

      setLoading(false);
      router.replace("/dashboard");
      toast({
        title: "Course Generation Started! 🎉",
        description: "Your AI-powered course is being created. Check your dashboard for updates.",
      });
    } catch (error) {
      console.error("API Request Failed:", error.response?.data || error);
      
      // Handle daily limit error specifically
      if (error.response?.status === 429) {
        toast({
          title: "Daily Limit Reached ⏰",
          description: "You've reached your daily course creation limit. Upgrade to premium for unlimited courses or try again tomorrow.",
          variant: "destructive",
        });
        // Redirect to upgrade page for free users
        router.push("/dashboard/upgrade");
      } else {
        toast({
          title: "Generation Failed ❌",
          description: "Something went wrong. Please try again or contact support.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return formData.courseType;
    if (step === 1) return formData.topic && formData.difficultyLevel;
    return false;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Mobile-first top navigation bar for smaller screens */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <h1 className="text-lg font-bold text-gradient-primary font-display">
                Create Course
              </h1>
            </div>
            <div className="text-xs text-muted-foreground">
              Step {step + 1}/{steps.length}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Header - Hidden on mobile, shown on larger screens */}
          <div className="hidden lg:block text-center mb-12 fade-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              <h1 className="heading-1 text-gradient-primary font-display">
                Create Your Course
              </h1>
            </div>
            
            <p className="body-large text-muted-foreground max-w-2xl mx-auto">
              Transform your learning goals into comprehensive, AI-powered courses with interactive content and personalized study materials.
            </p>
          </div>

          {/* Progress Stepper */}
          <div className="mb-8 lg:mb-12 slide-up" style={{ animationDelay: '200ms' }}>
            {/* Mobile stepper - simplified horizontal progress bar */}
            <div className="lg:hidden">
              <div className="flex items-center justify-center mb-4">
                {steps.map((stepItem, index) => {
                  const isCompleted = step > stepItem.id;
                  const isActive = step === stepItem.id;
                  
                  return (
                    <div key={stepItem.id} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                        isCompleted 
                          ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white"
                          : isActive 
                          ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                          : "bg-white/10 text-muted-foreground"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                          step > stepItem.id 
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : "bg-white/10"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <h2 className="text-base font-semibold text-foreground mb-1">
                  {steps[step].title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {steps[step].description}
                </p>
              </div>
            </div>

            {/* Desktop stepper - full detailed version */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="flex items-center space-x-4">
                {steps.map((stepItem, index) => {
                  const Icon = stepItem.icon;
                  const isActive = step === stepItem.id;
                  const isCompleted = step > stepItem.id;
                  
                  return (
                    <React.Fragment key={stepItem.id}>
                      <div className="flex flex-col items-center">
                        <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${
                          isCompleted 
                            ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"
                            : isActive 
                            ? "bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg scale-110"
                            : "bg-white/5 border border-white/20"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-8 w-8 text-white" />
                          ) : (
                            <Icon className={`h-8 w-8 ${
                              isActive ? "text-white" : "text-muted-foreground"
                            }`} />
                          )}
                        </div>
                        <div className="mt-3 text-center">
                          <h3 className={`text-sm font-semibold transition-colors ${
                            isActive ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {stepItem.title}
                          </h3>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-24 h-0.5 mx-2 transition-all duration-300 ${
                          isCompleted 
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : "bg-white/20"
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl slide-up" style={{ animationDelay: '400ms' }}>
            {step === 0 ? (
              <SelectOption handleUserInput={handleUserInput} formData={formData} />
            ) : step === 1 ? (
              <TopicInput handleUserInput={handleUserInput} formData={formData} setTopic={(value) => handleUserInput("topic", value)} setDifficultyLevel={(value) => handleUserInput("difficultyLevel", value)} />
            ) : null}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              {step < steps.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={GenerateCourseOutline}
                  disabled={!canProceed() || loading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Create Course
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

export default Create;