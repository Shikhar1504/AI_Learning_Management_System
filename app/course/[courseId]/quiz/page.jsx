"use client";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Brain, CheckCircle, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import QuizCardItem from "./_components/QuizCardItem";
import { useUser } from "@clerk/nextjs";

function Quiz() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [quiz, setQuiz] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studySessionTracked, setStudySessionTracked] = useState(false);

  useEffect(() => {
    if (courseId) {
      GetQuiz();
    }
  }, [courseId]);

  const GetQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await axios.post("/api/study-type", {
        courseId: courseId,
        studyType: "Quiz",
      });
      
      // Extract questions from the response data structure
      const responseData = result.data;
      let quizQuestions = [];
      
      if (responseData && typeof responseData === 'object') {
        // If response has questions property, use it
        if (responseData.questions && Array.isArray(responseData.questions)) {
          quizQuestions = responseData.questions;
        }
        // If response is directly an array, use it
        else if (Array.isArray(responseData)) {
          quizQuestions = responseData;
        }
      }
      
      if (quizQuestions.length > 0) {
        setQuiz(quizQuestions);
        // Track study activity when quiz is first loaded
        if (!studySessionTracked) {
          trackStudyActivity();
        }
      } else {
        setError("No quiz questions found. Please generate quiz content first.");
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setError("Failed to load quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Track study activity for streak
  const trackStudyActivity = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || studySessionTracked) return;
    
    try {
      // First, ensure user exists in the database using the proper endpoint
      await axios.post('/api/ensure-user-exists', {
        user: {
          id: user.id,
          name: user.fullName || user.firstName || 'User',
          email: user.primaryEmailAddress.emailAddress
        }
      });
      
      // Then track the study activity using the correct endpoint
      // The user ID should be the email address based on the API route
      await axios.put(`/api/users/${user.primaryEmailAddress.emailAddress}/stats`, {
        dailyActivity: true,
        studyTimeHours: 0.33, // 20 minutes of quiz time
        quizzesCompleted: 1
      });
      setStudySessionTracked(true);
      console.log('✅ Study activity tracked for streak');
    } catch (error) {
      console.error('❌ Failed to track study activity:', error);
      // Don't break the UI if tracking fails
    }
  };

  const handleAnswerSelect = (userAnswer) => {
    if (isAnswered) return; // Prevent changing answer after selection
    
    setSelectedAnswer(userAnswer);
    setIsAnswered(true);
    
    // Check if answer is correct
    const correct = userAnswer === quiz[currentQuestion]?.answer;
    if (correct) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsCompleted(false);
  };

  const handleGoBack = () => {
    router.push(`/course/${courseId}`);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto">
            <Brain className="h-8 w-8 text-green-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Loading Quiz...</h2>
          <p className="text-muted-foreground">Preparing your questions</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Quiz Not Available</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={GetQuiz} className="btn-primary">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleGoBack} variant="outline" className="border-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Completion State
  if (isCompleted) {
    const percentage = Math.round((score / quiz.length) * 100);
    const isGoodScore = percentage >= 70;
    
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-white/10 bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <Brain className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Quiz Complete!</h1>
                  <p className="text-muted-foreground">Great job on finishing the quiz</p>
                </div>
              </div>
              <Button onClick={handleGoBack} variant="outline" className="border-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-8">
            <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center ${isGoodScore ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
              <div className="text-4xl font-bold text-foreground">
                {percentage}%
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-foreground">
                {isGoodScore ? 'Excellent Work!' : 'Good Effort!'}
              </h2>
              <p className="text-xl text-muted-foreground">
                You scored {score} out of {quiz.length} questions correctly
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleRestartQuiz} className="btn-primary">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
              <Button onClick={handleGoBack} variant="outline" className="border-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz State
  const currentQ = quiz[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.length) * 100;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/10 bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Brain className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Knowledge Quiz</h1>
                <p className="text-muted-foreground">Question {currentQuestion + 1} of {quiz.length}</p>
              </div>
            </div>
            <Button onClick={handleGoBack} variant="outline" className="border-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Quiz
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Question */}
          <QuizCardItem
            quiz={currentQ}
            selectedAnswer={selectedAnswer}
            isAnswered={isAnswered}
            onAnswerSelect={handleAnswerSelect}
          />

          {/* Answer Feedback */}
          {isAnswered && (
            <div className="space-y-4">
              <div className={`modern-card p-6 border ${
                selectedAnswer === currentQ?.answer
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'border-red-500/30 bg-red-500/10'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    selectedAnswer === currentQ?.answer
                      ? 'bg-green-500/20'
                      : 'bg-red-500/20'
                  }`}>
                    {selectedAnswer === currentQ?.answer ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <X className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-2 ${
                      selectedAnswer === currentQ?.answer
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {selectedAnswer === currentQ?.answer ? 'Correct!' : 'Incorrect'}
                    </h3>
                    {selectedAnswer !== currentQ?.answer && (
                      <p className="text-muted-foreground">
                        The correct answer is: <span className="font-medium text-foreground">{currentQ?.answer}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div className="flex justify-center">
                <Button onClick={handleNextQuestion} className="btn-primary px-8">
                  {currentQuestion < quiz.length - 1 ? 'Next Question' : 'Complete Quiz'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Quiz;
