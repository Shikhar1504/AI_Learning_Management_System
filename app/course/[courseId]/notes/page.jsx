"use client";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EndScreen from "../_components/EndScreen";

function ViewNotes() {
  const { courseId } = useParams(); // This will get the courseId from the URL
  const { user } = useUser();
  const [notes, setNotes] = useState();
  const [stepCount, setStepCount] = useState(0); // Set the initial value of stepCount to 0 (first page)
  const [studySessionTracked, setStudySessionTracked] = useState(false);
  const route = useRouter();

  useEffect(() => {
    GetNotes();
  }, []); // Empty array means it will run only once (when the component mounts)

  const GetNotes = async () => {
    const result = await axios.post("/api/study-type", {
      // API call to study-type, inside it will call the method that studyType: "notes",
      courseId: courseId,
      studyType: "notes",
    });
    console.log(result?.data); // This will return the notes in the console
    setNotes(result?.data); // Update notes

    // Track study activity when notes are first loaded
    if (result?.data && !studySessionTracked) {
      trackStudyActivity();
    }
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
          studyTimeHours: 0.5, // 30 minutes of reading notes
          chaptersCompleted: 1,
        }
      );
      setStudySessionTracked(true);
      console.log("✅ Study activity tracked for streak");
    } catch (error) {
      console.error("❌ Failed to track study activity:", error);
      // Don't break the UI if tracking fails
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/10 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notes</h1>
              <p className="text-muted-foreground mt-1">
                Study your course notes
              </p>
            </div>
            <Button
              onClick={() => route.push(`/course/${courseId}`)}
              variant="outline"
              className="border-white/20 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2 text-white" />
              Back to Course
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center w-full py-8">
        {/* This will show the chapter as a progress bar */}
        <div className="w-full max-w-4xl flex items-center gap-2 my-6 justify-center">
          {notes?.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-8 rounded-full transition-all duration-300 ${
                index <= stepCount ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Notes Display */}
        <div className="w-full max-w-4xl mt-4">
          {!notes ? (
            <div className="space-y-3">
              <div className="h-6 w-2/3 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <div
              className="noteClass border p-6 md:p-8 rounded-2xl bg-card"
              dangerouslySetInnerHTML={{
                __html: notes?.[stepCount]?.notes?.replace("```html", " "),
              }}
            />
          )}

          {/* Show Previous and Next buttons, or End of Course button */}
          <div className="mt-6">
            {stepCount === notes?.length ? (
              // Show the End of Course button when it's the last note
              <EndScreen data={notes} stepCount={stepCount} />
            ) : (
              <div className="flex justify-between items-center w-full max-w-4xl mt-7 mb-7">
                {/* This will show the previous button if the stepCount is not 0 */}
                {stepCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStepCount(stepCount - 1)}
                    className="text-white"
                  >
                    Previous
                  </Button>
                )}

                {/* This will show the next button to move to the next note */}
                {stepCount < notes?.length && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setStepCount(stepCount + 1)}
                  >
                    Next
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewNotes;
