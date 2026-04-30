import Image from "next/image";
import React, { useState } from "react";

function SelectOption({ handleUserInput }) {
  const Options = [
    {
      name: "Exam",
      icon: "/exam_1.png",
    },
    {
      name: "Job Interview",
      icon: "/job.png",
    },
    {
      name: "Practice",
      icon: "/practice.png",
    },
    {
      name: "Coding Prep",
      icon: "/code.png",
    },
    {
      name: "Other",
      icon: "/knowledge.png",
    },
  ];
  const [selectedOption, setSelectedOption] = useState();
  return (
    <div>
      <h2 className="text-center mb-2 text-lg">
        What topic you want to master today?
      </h2>
      <div className="grid grid-cols-2 mt-5 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {Options.map((option, index) => (
          <div
            key={index}
            className={`p-4 flex flex-col items-center justify-center 
                border rounded-xl cursor-pointer transition-all duration-300
                ${
                  option?.name == selectedOption
                    ? "bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                    : "bg-white/[0.03] border-white/[0.08] hover:border-cyan-400/40 hover:bg-white/[0.06]"
                }`}
            onClick={() => {
              setSelectedOption(option.name);
              handleUserInput("courseType", option.name);
            }}
          >
            <Image src={option.icon} alt={option.name} width={50} height={50} />
            <h2 className="text-sm mt-2">{option.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectOption;