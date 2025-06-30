import React, { use, useEffect, useState } from "react";
import MaterialCardItem from "./MaterialCardItem";
import axios from "axios";
function StudyMaterialSection({ courseId, course }) {
  const [studyTypeContent, setStudyTypeContent] = useState();
  const MaterialList = [
    {
      name: "Notes/Chapters",
      desc: "Read notes to prepare it",
      icon: "/notes.png",
      path: "/notes",
      type: "notes",
    },
    {
      name: "Flashcard",
      desc: "Flashcard to remember the concepts",
      icon: "/flashcard.png",
      path: "/flashcards",
      type: "flashcard",
    },
    {
      name: "Quiz",
      desc: "Great way to test your knowledge",
      icon: "/quiz.png",
      path: "/quiz",
      type: "quiz",
    }
  ];

  useEffect(() => {
    GetStudyMaterial();
  }, [courseId]);

  const GetStudyMaterial = async () => {
    const result = await axios.post("/api/study-type", {
      //api call to get study material
      courseId: courseId,
      studyType: "ALL",
    });
    console.log(result?.data);
    setStudyTypeContent(result.data); //update studyTypeContent
  };

  return (
    <div className="mt-5">
      <h2 className="font-medium text-xl">Study Material</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-3">
        {MaterialList.map((item, index) => (
          <MaterialCardItem
            item={item}
            key={index}
            studyTypeContent={studyTypeContent}
            course={course}
            refreshData={GetStudyMaterial}
          />
        ))}
      </div>
    </div>
  );
}

export default StudyMaterialSection;