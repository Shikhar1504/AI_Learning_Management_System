import { Button } from "@/components/ui/button";
import React from "react";

function StepProgress({ stepCount, setStepCount, data }) {
  return (
    <div className="flex gap-5 items-center">
      {stepCount != 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStepCount(stepCount - 1)}
        >
          Previous
        </Button>
      )}
      {/*If the current step's index is less than stepCount, the div gets the "bg-primary" class (typically a highlighted color).
      Otherwise, it gets "bg-gray-200" (a lighter or inactive color).*/}
      {data?.map((item, index) => (
        <div
          key={index}
          className={`w-full h-2 rounded-full
                ${index < stepCount ? "bg-primary" : "bg-gray-200"}`}
        ></div>
      ))}
      {data?.length > stepCount && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStepCount(stepCount + 1)}
        >
          Next
        </Button>
      )}
    </div>
  );
}

export default StepProgress;
