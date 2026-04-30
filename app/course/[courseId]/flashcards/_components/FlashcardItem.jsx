import { RotateCcw } from "lucide-react";

function FlashcardItem({ handleClick, isFlipped, flashcard }) {
  // Handle cases where flashcard data might be missing
  const frontText =
    flashcard?.front || flashcard?.question || "Question missing";
  const backText = flashcard?.back || flashcard?.answer || "Answer missing";

  return (
    <div className="flex items-center justify-center w-full">
      <div
        className="relative h-[400px] w-[320px] md:h-[480px] md:w-[600px] cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        style={{ perspective: "1000px" }}
      >
        {/* Card Container */}
        <div
          className="relative w-full h-full transition-transform duration-700 ease-in-out"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front side of the card */}
          <div
            className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/[0.08] flex flex-col items-center justify-center p-8 overflow-hidden group"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Inner reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none rounded-3xl" />
            
            {/* Front indicator */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10 text-white/80">
              Question
            </div>

            {/* Flip hint */}
            <div className="absolute top-4 right-4 p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10 text-white/60 group-hover:text-white/90 transition-colors">
              <RotateCcw className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="text-center space-y-4 relative z-10">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-white">
                {frontText}
              </h2>

              <p className="text-white/60 text-sm md:text-base">
                Click to reveal answer
              </p>
            </div>
          </div>

          {/* Back side of the card */}
          <div
            className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/[0.08] flex flex-col items-center justify-center p-8 overflow-hidden group"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Inner reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none rounded-3xl" />
            
            {/* Back indicator */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10 text-white/80">
              Answer
            </div>

            {/* Flip hint */}
            <div className="absolute top-4 right-4 p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10 text-white/60 group-hover:text-white/90 transition-colors">
              <RotateCcw className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="text-center space-y-4 relative z-10">
              <h2 className="text-lg md:text-xl lg:text-2xl font-semibold leading-tight text-white">
                {backText}
              </h2>

              <p className="text-white/60 text-sm md:text-base">
                Click to see question again
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashcardItem;
