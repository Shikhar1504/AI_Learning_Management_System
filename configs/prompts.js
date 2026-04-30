export const FLASHCARD_PROMPT = (chapters) =>
  `Generate exactly 10 flashcards based on the following course topics: ${chapters}.

Return a JSON array of objects. Each object MUST have the following structure:
{
  "front": "The flashcard question",
  "back": "The flashcard answer",
  "topic": "The exact topic from the course list this flashcard relates to"
}

RULES:
- "topic" MUST be selected EXACTLY from the provided list of topics. DO NOT shorten, paraphrase, or invent new topics.
- Each flashcard must map to ONE topic.
- Distribute the flashcards across multiple topics.
- Avoid repetition.
- Return ONLY valid JSON array.`;

export const QUIZ_PROMPT = (chapters) =>
  `Generate a quiz based on the following course topics: ${chapters}.

Return a JSON array of exactly 10 question objects. Each object MUST have the following structure:
{
  "question": "The quiz question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The exact text of the correct option",
  "topic": "The exact topic from the course list this question relates to"
}

RULES:
- "topic" MUST be selected EXACTLY from the provided list of topics. DO NOT shorten, paraphrase, or invent new topics.
- "correctAnswer" MUST exactly match one of the strings in the "options" array.
- Each question must map to ONE topic.
- Distribute the questions across multiple topics.
- Avoid repetition.

🔥 IMPORTANT QUALITY RULES:
- DO NOT generate simple definition questions like "What is X?" unless absolutely necessary.
- DO NOT repeat flashcard-style questions.
- Prefer:
  • application-based questions
  • scenario-based questions
  • edge-case or tricky questions
- At least:
  • 4 questions must be application-based
  • 3 questions must be tricky or confusing
  • Maximum 3 definition-based questions

🎯 OPTIONS QUALITY:
- All 4 options must be plausible (no obviously wrong answers)
- Include at least 2 confusing but realistic distractors
- Avoid silly or unrelated options

🎯 QUESTION STYLE:
- Make questions slightly challenging (interview level)
- Avoid copying wording from common definitions
- Use real-world or coding scenarios where possible

- Return ONLY valid JSON array.`;

export const COURSE_OUTLINE_PROMPT = (topic, courseType, difficultyLevel) => {
  let topicCount = 5;
  const diffStr = String(difficultyLevel).toLowerCase();

  if (diffStr.includes("medium")) {
    topicCount = 7;
  } else if (diffStr.includes("hard")) {
    topicCount = 10;
  }

  return `Generate a study material for ${topic} for ${courseType} at ${difficultyLevel} difficulty level.

Return a JSON object with the following structure:
- courseTitle: string
- summary: string (2-3 sentence course overview)
- chapters: array of EXACTLY 3 chapter objects

Each chapter object must have:
- title: string (RULES BELOW)
- summary: string (what this chapter covers, 1-2 sentences)
- emoji: string (one relevant emoji)
- topics: array of EXACTLY ${topicCount} topic title strings

CHAPTER TITLE RULES (CRITICAL):
- NEVER use generic labels like "Chapter 1", "Chapter 2", "Introduction", "Overview", "Basics"
- ALWAYS use descriptive, topic-specific titles that include domain keywords from ${topic}
- Each title must be 3-8 words and reflect the actual concepts taught inside that chapter
- Titles must be meaningful for search, embeddings, and retrieval systems

EXAMPLES of BAD titles (NEVER generate these):
  "Chapter 1", "Introduction", "Getting Started", "Overview", "Basics"

EXAMPLES of GOOD titles for a Java OOP course:
  "Classes and Objects in Java"
  "Inheritance and Method Overriding"
  "Interfaces and Abstract Classes"

Apply the same title quality to ${topic} — each title must name the specific concepts covered.

IMPORTANT: Generate EXACTLY 3 chapters and EXACTLY ${topicCount} topics per chapter. Return only valid JSON.`;
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
