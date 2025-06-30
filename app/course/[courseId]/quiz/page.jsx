"use client";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import EndScreen from "../_components/EndScreen";
import StepProgress from "../_components/StepProgress";
import QuizCardItem from "./_components/QuizCardItem";

function Quiz() {
  const { courseId } = useParams();
  const [quizData, setQuizData] = useState();
  const [stepCount, setStepCount] = useState(0);
  const [isCorrectAns, setIsCorrectAnswer] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [correctAns, setCorrectAns] = useState();

  //fetches the quiz data tied to the current course ID without triggering multiple calls during re-renders.
  //   useEffect(() => {
  //     GetQuiz();
  //   }, [quiz]);

  useEffect(() => {
    GetQuiz();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!quiz || quiz.length === 0) {
        window.location.reload();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [quiz]);

  const GetQuiz = async () => {
    console.log(courseId);
    const result = await axios.post("/api/study-type", {
      courseId: courseId,
      studyType: "Quiz",
    });
    setQuizData(result.data);
    setQuiz(result.data?.content?.questions);
  };

  const checkAnswer = (userAnswer, currentQuestion) => {
    console.log(currentQuestion?.answer, userAnswer);
    if (userAnswer == currentQuestion?.answer) {
      setIsCorrectAnswer(true);
      setCorrectAns(currentQuestion?.answer);
      return;
    }
    setIsCorrectAnswer(false);
    setCorrectAns(currentQuestion?.answer);
  };
  //Every time stepCount changes (which might represent moving to a new question or step in a quiz), the effect clears the previous answer status.
  useEffect(() => {
    setCorrectAns(null);
    setIsCorrectAnswer(null);
  }, [stepCount]);

  return (
    <div>
      <h2 className="font-bold text-2xl text-center mb-4">Quiz Time !!!</h2>

      {quiz ? (
        <>
          <StepProgress
            data={quiz}
            stepCount={stepCount}
            setStepCount={(value) => setStepCount(value)}
          />

          <div>
            {quiz?.[stepCount] && (
              <QuizCardItem
                quiz={quiz[stepCount]}
                userSelectedOption={(v) => checkAnswer(v, quiz[stepCount])}
              />
            )}
          </div>

          {/*Show the div that displays the correct or incorrect answer*/}
          {isCorrectAns == false && (
            <div>
              <div className="border p-3 border-red-700 bg-red-200 rounded-lg mt-10 mb-10">
                <h2 className="font-bold text-lg text-red-600">Incorrect</h2>
                <p className="text-red-600">Correct Answer is : {correctAns}</p>
              </div>
            </div>
          )}

          {isCorrectAns == true && (
            <div>
              <div className="border p-3 border-green-700 bg-green-200 rounded-lg mt-10 mb-10">
                <h2 className="font-bold text-lg text-green-600">Correct</h2>
                <p className="text-green-600">Yout answer is Correct</p>
              </div>
            </div>
          )}

          <EndScreen data={quiz} stepCount={stepCount} />
        </>
      ) : (
        <p className="text-center text-gray-500">Loading Quiz...</p>
      )}
    </div>
  );
}

export default Quiz;
