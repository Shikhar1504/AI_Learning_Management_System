import { useState } from "react";

function QuizCardItem({ quiz, selectedAnswer, isAnswered, onAnswerSelect }) {
  if (!quiz) return null;

  return (
    <div className="modern-card p-8">
      {/* Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
          {quiz.question}
        </h2>
        <p className="text-muted-foreground">
          Select the best answer from the options below
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {quiz.options?.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = isAnswered && option === quiz.answer;
          const isIncorrect = isAnswered && isSelected && option !== quiz.answer;
          
          return (
            <button
              key={index}
              onClick={() => !isAnswered && onAnswerSelect(option)}
              disabled={isAnswered}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-300 group ${
                isAnswered
                  ? isCorrect
                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                    : isIncorrect
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-white/10 bg-white/5 text-muted-foreground'
                  : isSelected
                  ? 'border-purple-500/50 bg-purple-500/10 text-purple-400 scale-[1.02]'
                  : 'border-white/20 bg-white/5 text-foreground hover:border-purple-500/30 hover:bg-purple-500/5 hover:scale-[1.01]'
              } ${
                !isAnswered ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Option Letter */}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                  isAnswered
                    ? isCorrect
                      ? 'border-green-500 bg-green-500 text-white'
                      : isIncorrect
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-current'
                    : isSelected
                    ? 'border-purple-500 bg-purple-500 text-white'
                    : 'border-current group-hover:border-purple-500'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                
                {/* Option Text */}
                <div className="flex-1 font-medium">
                  {option}
                </div>
                
                {/* Status Indicator */}
                {isAnswered && (
                  <div className="ml-auto">
                    {isCorrect && (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {isIncorrect && (
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Instruction */}
      {!isAnswered && (
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            💡 Click on an option to select your answer
          </p>
        </div>
      )}
    </div>
  );
}

export default QuizCardItem;
