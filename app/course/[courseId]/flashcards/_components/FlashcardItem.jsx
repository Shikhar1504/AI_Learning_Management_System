import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

function FlashcardItem({ handleClick, isFlipped, flashcard }) {
  // Handle cases where flashcard data might be missing
  const frontText = flashcard?.front || flashcard?.question || "Question missing";
  const backText = flashcard?.back || flashcard?.answer || "Answer missing";

  const cardVariants = {
    flipped: { rotateY: 180 },
    unflipped: { rotateY: 0 },
  };

  const frontVariants = {
    flipped: { rotateY: 180 },
    unflipped: { rotateY: 0 },
  };

  const backVariants = {
    flipped: { rotateY: 0 },
    unflipped: { rotateY: -180 }, // Rotate back to show the back side
  };

  return (
    <div className="flex items-center justify-center w-full">
      <motion.div
        className="relative h-[400px] w-[320px] md:h-[480px] md:w-[600px] transform-style-preserve-3d"
        variants={cardVariants}
        animate={isFlipped ? "flipped" : "unflipped"}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        onClick={handleClick}
      >
        {/* Front side of the card */}
        <motion.div
          className="absolute inset-0 p-8 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 text-white flex flex-col items-center justify-center rounded-3xl cursor-pointer shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 backface-hidden border border-white/10"
          variants={frontVariants}
          animate={isFlipped ? "flipped" : "unflipped"}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Front indicator */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
            Question
          </div>
          
          {/* Flip hint */}
          <div className="absolute top-4 right-4 p-2 bg-white/20 rounded-full backdrop-blur-sm">
            <RotateCcw className="h-4 w-4" />
          </div>
          
          {/* Content */}
          <div className="text-center space-y-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
              {frontText}
            </h2>
            
            <p className="text-white/80 text-sm md:text-base">
              Click to reveal answer
            </p>
          </div>
        </motion.div>
        
        {/* Back side of the card */}
        <motion.div
          className="absolute inset-0 p-8 bg-gradient-to-br from-slate-50 to-white text-gray-900 flex flex-col items-center justify-center rounded-3xl cursor-pointer shadow-2xl hover:shadow-slate-200 transition-all duration-300 backface-hidden border border-gray-200"
          variants={backVariants}
          animate={isFlipped ? "flipped" : "unflipped"}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Back indicator */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Answer
          </div>
          
          {/* Flip hint */}
          <div className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full">
            <RotateCcw className="h-4 w-4 text-gray-600" />
          </div>
          
          {/* Content */}
          <div className="text-center space-y-4">
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold leading-tight text-gray-800">
              {backText}
            </h2>
            
            <p className="text-gray-500 text-sm md:text-base">
              Click to see question again
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default FlashcardItem;
