import React from "react";
import ReactCardFlip from "react-card-flip";

function FlashcardItem({ handleClick, isFlipped, flashcard }) {
  return (
    <div className="flex items-center justify-center mb-10">
      <ReactCardFlip isFlipped={isFlipped} flipDirection="vertical">
        {/*when isFlipped is False, the front side of the card is shown*/}
        <div
          className="p-4 bg-primary text-white flex items-center justify-center rounded-lg cursor-pointer shadow-lg h-[350px] w-[300px] md:h-[450px] md:w-[500px]"
          onClick={handleClick} // Call handleClick when the front side of the card is clicked
        >
          <h2 className="text-2xl font-medium text-center">
            {flashcard?.front}
          </h2>
        </div>
        {/* When isFlipped is true, the back side of the card is shown */}
        <div
          className="p-4 bg-white shadow-lg text-primary flex items-center justify-center rounded-lg cursor-pointer h-[350px] w-[300px] md:h-[450px] md:w-[500px] text-center"
          onClick={handleClick}
        >
          <h2 className="text-xl">{flashcard?.back}</h2>
        </div>
      </ReactCardFlip>
    </div>
  );
}

export default FlashcardItem;