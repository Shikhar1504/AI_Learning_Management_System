export const FLASHCARD_PROMPT = (chapters) =>
  `Generate exactly 10 flashcards on topic : ${chapters} in JSON format with front back content`;

export const QUIZ_PROMPT = (chapters) =>
  `Generate Quiz on topic : ${chapters} with exactly 10 Questions and Options along with correct answer in JSON format`;

export const COURSE_OUTLINE_PROMPT = (topic, courseType, difficultyLevel) => {
  let topicCount = 5;
  const diffStr = String(difficultyLevel).toLowerCase();
  
  if (diffStr.includes("medium")) {
    topicCount = 7;
  } else if (diffStr.includes("hard")) {
    topicCount = 10;
  }
  
  return `Generate a study material for ${topic} for ${courseType} and level of difficulty will be ${difficultyLevel} with summary of course, List of Chapters (EXACTLY 3 chapters, no more, no less) along with summary and Emoji icon for each chapter, Topic list in each chapter (EXACTLY ${topicCount} topics per chapter), and all result in JSON format. IMPORTANT: Generate exactly 3 chapters only and exactly ${topicCount} topics in each chapter.`;
};

export const TOPIC_NOTES_PROMPT = (topicTitle, chapterTitle) =>
  "Generate structured study notes for the topic: " +
  topicTitle +
  " from chapter: " +
  chapterTitle +
  "\\n" +
  "Rules:\\n" +
  "- Keep total output under 600 words.\\n" +
  "- Explanation max 150 words.\\n" +
  "- No repetition.\\n" +
  "- No flashcards.\\n" +
  "- No chapter summary.\\n" +
  "- Do not generate content for other topics.\\n" +
  "- Format strictly in markdown:\\n" +
  "## Explanation\\n" +
  "(120-150 words max)\\n" +
  "## Key Points\\n" +
  "- 3 to 5 concise concise bullet points\\n" +
  "## Code Example\\n" +
  "(One small example only if relevant, use markdown code block)\\n" +
  "## Interview Questions\\n" +
  "- Question 1\\n" +
  "- Question 2";
