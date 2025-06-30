import React, { useState } from "react";

function QuizCardItem({ quiz, userSelectedOption }) {
  // Local state to track which option the user has clicked
  const [selectedOption, setSelectedOption] = useState();

  return (
    quiz && (
      <div className="mt-10 p-5">
        <h2 className="font-medium text-3xl text-center">{quiz?.question}</h2>

        <div className="grid grid-cols-2 gap-5 mt-6">
        {/* display each quiz options, add in hovering effect and if
         user select the option it will change the colour and update the user selected option */}
          {quiz?.options.map((option, index) => (
            <h2
              onClick={() => {
                setSelectedOption(option);
                userSelectedOption(option);
              }}
              key={index}
              variant="outline"
              className={`w-full border rounded-full p-3 px-4 text-center
                text-lg hover:bg-gray-200 cursor-pointer
                ${
                  selectedOption == option &&
                  "bg-primary text-white hover:bg-primary"
                }`}
            >
              {option}
            </h2>
          ))}
        </div>
      </div>
    )
  );
}

export default QuizCardItem;
