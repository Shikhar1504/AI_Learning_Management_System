"use client";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import EndScreen from "../_components/EndScreen";

function ViewNotes() {
  const { courseId } = useParams(); // This will get the courseId from the URL
  const [notes, setNotes] = useState();
  const [stepCount, setStepCount] = useState(0); // Set the initial value of stepCount to 0 (first page)
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
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* This will show the chapter as a progress bar */}
      <div className="w-full max-w-3xl flex items-center gap-2 my-4">
        {notes?.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              index <= stepCount ? "bg-primary" : "bg-gray-200"
            }`}
          ></div>
        ))}
      </div>

      {/* Notes Display */}
      <div className="w-full max-w-3xl mt-6">
        <div
          className=" mt-3 noteClass border p-4 rounded-lg shadow-md"
          dangerouslySetInnerHTML={{
            __html: notes?.[stepCount]?.notes?.replace("```html", " "),
          }}
        />

        {/* Show Previous and Next buttons, or End of Course button */}
        <div className="mt-4">
          {stepCount === notes?.length ? (
            // Show the End of Course button when it's the last note
            <EndScreen data={notes} stepCount={stepCount} />
          ) : (
            <div className="flex justify-between items-center w-full max-w-3xl mt-7 mb-7">
              {/* This will show the previous button if the stepCount is not 0 */}
              {stepCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStepCount(stepCount - 1)}
                >
                  Previous
                </Button>
              )}

              {/* This will show the next button to move to the next note */}
              {stepCount < notes?.length && (
                <Button
                  variant="outline"
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
  );
}

export default ViewNotes;