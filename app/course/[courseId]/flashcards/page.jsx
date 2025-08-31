"use client";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { AlertCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FlashcardItem from "./_components/FlashcardItem";

function Flashcards() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [flashCards, setFlashCards] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [studySessionTracked, setStudySessionTracked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    GetFlashCards();
  }, []);

  // Listen for carousel "select" event to know when the user navigates to a new flashcard
  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setIsFlipped(false); // Reset flip state on new card
      setCurrentCard(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);

    // Set initial card
    setCurrentCard(api.selectedScrollSnap());

    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  const GetFlashCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await axios.post("/api/study-type", {
        courseId: courseId,
        studyType: "Flashcard",
      });

      console.log("Flashcard API Response:", result?.data);

      // The API returns content directly for specific study types, not wrapped in 'content'
      const flashcardData = result?.data || [];

      if (Array.isArray(flashcardData) && flashcardData.length > 0) {
        setFlashCards(flashcardData);
      } else {
        setError(
          "No flashcards found for this course. Please generate flashcards first."
        );
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      setError("Failed to load flashcards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    // Prevent clicks during animation to avoid double flips
    if (isAnimating) return;

    setIsAnimating(true);
    setIsFlipped((prev) => !prev);

    // Track session start and study activity
    if (!sessionStarted) {
      setSessionStarted(true);
      trackStudyActivity();
    }

    // Reset animation flag after animation completes
    setTimeout(() => setIsAnimating(false), 650); // Slightly longer than animation duration
  };

  // Track study activity for streak
  const trackStudyActivity = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || studySessionTracked) return;

    try {
      // First, ensure user exists in the database using the proper endpoint
      await axios.post("/api/ensure-user-exists", {
        user: {
          id: user.id,
          name: user.fullName || user.firstName || "User",
          email: user.primaryEmailAddress.emailAddress,
        },
      });

      // Then track the study activity using the correct endpoint
      // The user ID should be the email address based on the API route
      await axios.put(
        `/api/users/${user.primaryEmailAddress.emailAddress}/stats`,
        {
          dailyActivity: true,
          studyTimeHours: 0.25, // 15 minutes of flashcard study
          flashcardSessions: 1,
        }
      );
      setStudySessionTracked(true);
      console.log("✅ Study activity tracked for streak");
    } catch (error) {
      console.error("❌ Failed to track study activity:", error);
      // Don't break the UI if tracking fails
    }
  };

  const handleGoBack = () => {
    router.push(`/course/${courseId}`);
  };

  const handleRetry = () => {
    GetFlashCards();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCcw className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Loading Flashcards
            </h2>
            <p className="text-muted-foreground">
              Fetching your study materials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Unable to Load Flashcards
            </h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry} className="btn-primary">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/10 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
              <p className="text-muted-foreground mt-1">
                Master concepts with interactive flashcards
              </p>
            </div>
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {flashCards.length > 0 ? (
          <>
            {/* Flashcard Display */}
            <div className="flex items-center justify-center mb-8">
              <Carousel setApi={setApi} className="w-full max-w-4xl">
                <CarouselContent>
                  {flashCards.map((flashcard, index) => (
                    <CarouselItem
                      key={index}
                      className="flex items-center justify-center"
                    >
                      <FlashcardItem
                        handleClick={handleClick}
                        isFlipped={isFlipped}
                        flashcard={flashcard}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-6 sm:-left-12" />
                <CarouselNext className="-right-6 sm:-right-12" />
              </Carousel>
            </div>

            {/* Progress Indicator */}
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">
                Card{" "}
                <span className="font-medium text-foreground">
                  {currentCard + 1}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {flashCards.length}
                </span>
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto mt-2 bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentCard + 1) / flashCards.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="modern-card p-6 text-center space-y-4">
              <h3 className="font-semibold text-foreground">How to Study</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Click the card to flip</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Use arrows to navigate</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Review and repeat</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6 py-20">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No Flashcards Available
              </h2>
              <p className="text-muted-foreground">
                There are no flashcards for this course yet.
              </p>
            </div>
            <Button onClick={handleGoBack} className="btn-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
//working on how to make the flaashcard directly back to the previous course page
export default Flashcards;
