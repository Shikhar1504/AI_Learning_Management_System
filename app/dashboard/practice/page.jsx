"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dumbbell,
  Trophy,
  Target,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const normalizeAnswer = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

function Practice() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    bestScore: 0,
    averageScore: 0,
    lastScore: 0,
    streak: 0,
  });

  // Quiz State
  const [quizActive, setQuizActive] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null); // null, true, false
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [quizCompleted]); // Refresh stats when a quiz is completed

  useEffect(() => {
    let interval;
    if (quizActive && !quizCompleted) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizActive, quizCompleted]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/quiz-stats");
      if (response.ok) {
        const payload = await response.json();
        const normalizedStats = payload?.data || payload;
        setStats({
          totalAttempts: normalizedStats?.totalAttempts || 0,
          bestScore: normalizedStats?.bestScore || 0,
          averageScore: normalizedStats?.averageScore || 0,
          lastScore: normalizedStats?.lastScore || 0,
          streak: normalizedStats?.streak || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    setQuizLoading(true);
    try {
      const response = await fetch("/api/practice-quiz");
      if (response.ok) {
        const data = await response.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setQuizActive(true);
          setQuizCompleted(false);
          setCurrentQuestionIndex(0);
          setScore(0);
          setTimer(0);
          setSelectedOption(null);
          setIsCorrect(null);
        } else {
          toast.error(
            "No practice questions available yet. Create some courses first!",
          );
        }
      }
    } catch (error) {
      console.error("Failed to start quiz:", error);
      toast.error("Failed to start quiz. Please try again.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleOptionSelect = (option) => {
    if (selectedOption !== null) return; // Prevent changing answer

    setSelectedOption(option);

    const currentQuestion = questions[currentQuestionIndex];
    const isAnswerCorrect =
      normalizeAnswer(option) === normalizeAnswer(currentQuestion.answer);
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      setScore((prev) => prev + 1);
      toast.success("Correct!", { position: "bottom-center", duration: 1000 });
    } else {
      toast.error(`Incorrect. Correct answer: ${currentQuestion.answer}`, {
        position: "bottom-center",
        duration: 2000,
      });
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setQuizCompleted(true);
    setQuizActive(false);
    const timeTaken = timer; // ISSUE 3 FIX: Use timer state directly

    try {
      await fetch("/api/quiz-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          totalQuestions: questions.length,
          timeTaken,
          courseId: null, // Mixed quiz
        }),
      });
      toast.success("Quiz complete! Stats updated.");
    } catch (error) {
      console.error("Failed to save attempt:", error);
      toast.error("Failed to save results.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getFeedbackMessage = (percentage) => {
    if (percentage >= 90)
      return {
        title: "Excellent!",
        message: "You're a master of these topics.",
        color: "text-green-500",
      };
    if (percentage >= 70)
      return {
        title: "Great Job!",
        message: "Solid understanding, keep it up.",
        color: "text-blue-500",
      };
    if (percentage >= 50)
      return {
        title: "Good Effort",
        message: "You're getting there. Review weaker topics.",
        color: "text-yellow-500",
      };
    return {
      title: "Keep Practicing",
      message: "Review your course materials and try again.",
      color: "text-red-500",
    };
  };

  const handleSafeBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard/practice");
    }
  };

  // --- RENDER HELPERS ---

  if (quizActive && !quizCompleted) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress =
      questions.length > 0
        ? (currentQuestionIndex / questions.length) * 100
        : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Quiz Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-pink-500/20">
              <Dumbbell className="h-5 w-5 text-pink-500" />
            </div>
            <span className="font-semibold text-foreground">Practice Mode</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Clock className="h-4 w-4 text-blue-400" />
              <span>{formatTime(timer)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Target className="h-4 w-4 text-purple-400" />
              <span>
                {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2" />

        {/* Question Card */}
        <div className="bg-[#111623]/80 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-8 leading-relaxed">
            {currentQuestion?.question}
          </h2>

          <div className="grid gap-4">
            {currentQuestion?.options?.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrectAnswer =
                normalizeAnswer(option) ===
                normalizeAnswer(currentQuestion.answer);

              let optionClass =
                "p-4 rounded-xl border-2 text-left transition-all duration-200 font-medium ";

              if (selectedOption !== null) {
                // Reveal state
                if (isSelected) {
                  optionClass += isCorrect
                    ? "bg-green-500/20 border-green-500 text-green-100"
                    : "bg-red-500/20 border-red-500 text-red-100";
                } else if (isCorrectAnswer) {
                  optionClass +=
                    "bg-green-500/20 border-green-500 text-green-100";
                } else {
                  optionClass += "bg-white/5 border-transparent opacity-50";
                }
              } else {
                // Normal state
                optionClass +=
                  "bg-white/5 border-transparent hover:bg-white/10 hover:border-purple-500/50 hover:shadow-lg active:scale-[0.99]";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  disabled={selectedOption !== null}
                  className={optionClass}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {selectedOption !== null &&
                      isSelected &&
                      (isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end">
          <Button
            className="bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white border-0 shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all min-w-[140px]"
            disabled={selectedOption === null}
            onClick={nextQuestion}
          >
            {currentQuestionIndex < questions.length - 1
              ? "Next Question"
              : "Finish Quiz"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage =
      questions.length > 0 ? Math.round((score / questions.length) * 100) : 0; // ISSUE 2 FIX: Prevent div by zero
    const feedback = getFeedbackMessage(percentage);

    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-10">
        <div className="bg-[#111623]/80 backdrop-blur-xl p-8 md:p-12 border border-white/5 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(20,184,166,0.3)]">
            <Trophy className="h-12 w-12 text-white" />
          </div>

          <h2
            className={`text-4xl font-bold mb-2 font-display ${feedback.color}`}
          >
            {feedback.title}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            {feedback.message}
          </p>

          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-3xl font-bold text-white mb-1">
                {score}/{questions.length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Score
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {percentage}%
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Accuracy
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {formatTime(timer)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Time
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              className="h-12 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all backdrop-blur-sm"
              onClick={handleSafeBack}
            >
              Back to Dashboard
            </Button>
            <Button className="bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white border-0 shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all h-12 px-8" onClick={startQuiz}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <Dumbbell className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-white">
            Practice Arena
          </h1>
          <p className="text-muted-foreground text-lg">
            Master your knowledge with randomized quizzes.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Attempts",
            value: stats.totalAttempts,
            icon: Target,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Best Score",
            value: `${stats.bestScore}%`,
            icon: Trophy,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
          },
          {
            label: "Average Score",
            value: `${stats.averageScore}%`,
            icon: Zap,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
          {
            label: "Last Score",
            value: `${stats.lastScore}%`,
            icon: Clock,
            color: "text-pink-400",
            bg: "bg-pink-500/10",
          },
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="bg-[#111623]/80 backdrop-blur-xl border-white/5 hover:border-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-[0_0_20px_rgba(20,184,166,0.05)] transition-all duration-300 rounded-2xl"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {stat.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Action Area */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Start Quiz Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-[#111623] border border-teal-500/20 p-8 md:p-10 shadow-[0_0_30px_rgba(20,184,166,0.1)] group hover:border-teal-500/40 transition-all">
          <div className="absolute top-0 right-0 p-32 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-teal-500/20 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 p-24 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />

          <div className="relative z-10 flex flex-col items-start h-full justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-purple-200 mb-4">
              <Zap className="h-4 w-4" />
              <span>Recommendation</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 font-display">
              Mixed Practice Quiz
            </h2>
            <p className="text-purple-100/70 mb-8 max-w-lg text-lg">
              Challenge yourself with 10 random questions from all your courses.
              Perfect for testing your retention and finding knowledge gaps.
            </p>

            <Button
              size="lg"
              className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white border-0 hover:scale-105 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)]"
              onClick={startQuiz}
              disabled={quizLoading}
            >
              {quizLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-purple-900 border-t-transparent rounded-full animate-spin" />
                  Preparing...
                </span>
              ) : (
                <>
                  Start Practice Quiz
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info/Tips Card */}
        <div className="bg-[#111623]/80 backdrop-blur-xl rounded-3xl border border-white/5 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-teal-400" />
              Quick Tips
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-2">
                <span className="text-teal-400">•</span>
                <span>Quizzes are untimed but tracked for speed.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Questions cover all generated courses.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Aim for 90% accuracy for mastery.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
              Current Streak
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">
                {stats.streak ?? 0}
              </span>
              <span className="text-sm text-muted-foreground mb-1">days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Practice;
