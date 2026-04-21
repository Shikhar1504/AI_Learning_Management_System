import { GoogleGenerativeAI } from "@google/generative-ai";

// Fallback mechanism for API key switching
class GeminiWithFallback {
  constructor() {
    this.primaryApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    this.fallbackApiKey = process.env.GEMINI_FALLBACK_API_KEY;
    this.currentApiKey = this.primaryApiKey;
    this.isUsingFallback = false;

    if (!this.primaryApiKey) {
      throw new Error(
        "Primary Gemini API key (NEXT_PUBLIC_GEMINI_API_KEY) is required",
      );
    }

    this.genAI = new GoogleGenerativeAI(this.currentApiKey);
  }

  // Switch to fallback API key
  switchToFallback() {
    if (this.fallbackApiKey && !this.isUsingFallback) {
      console.log(
        "🔄 Switching to fallback Gemini API key due to overload/rate limiting",
      );
      this.currentApiKey = this.fallbackApiKey;
      this.isUsingFallback = true;
      this.genAI = new GoogleGenerativeAI(this.currentApiKey);
      return true;
    }
    return false;
  }

  // Reset to primary API key
  resetToPrimary() {
    if (this.isUsingFallback) {
      console.log("🔄 Resetting to primary Gemini API key");
      this.currentApiKey = this.primaryApiKey;
      this.isUsingFallback = false;
      this.genAI = new GoogleGenerativeAI(this.currentApiKey);
    }
  }

  // Get the current model
  getGenerativeModel(config) {
    return this.genAI.getGenerativeModel(config);
  }

  // Check if fallback is available
  hasFallback() {
    return !!this.fallbackApiKey;
  }

  // Get current status
  getStatus() {
    return {
      isUsingFallback: this.isUsingFallback,
      hasFallback: this.hasFallback(),
      currentKeyType: this.isUsingFallback ? "fallback" : "primary",
    };
  }
}

// Create singleton instance
const geminiWithFallback = new GeminiWithFallback();

export const MODELS = {
  SMART: "gemini-3-flash-preview", // high reasoning tasks
  FAST: "gemini-3.1-flash-lite-preview", // high-volume low-latency tasks
};

const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 8192);

// Course outline + notes require stronger reasoning quality.
export const HIGH_REASONING_CONFIG = {
  temperature: 1,
  maxOutputTokens: MAX_OUTPUT_TOKENS,
  thinking_config: {
    thinking_level: "high",
  },
  responseMimeType: "application/json",
};

// Flashcards + quiz are lighter, high-volume tasks and benefit from lower-cost reasoning.
export const MEDIUM_REASONING_CONFIG = {
  temperature: 1,
  maxOutputTokens: MAX_OUTPUT_TOKENS,
  thinking_config: {
    thinking_level: "medium",
  },
  responseMimeType: "application/json",
};

export const HIGH_REASONING_TEXT_CONFIG = {
  ...HIGH_REASONING_CONFIG,
  responseMimeType: "text/plain",
};

export function getModel(modelName) {
  return geminiWithFallback.getGenerativeModel({ model: modelName });
}

// Factory functions: create a FRESH chat session per call.
// This prevents shared history across concurrent requests (concurrency bug).
// The history array seeds the model with context on every call, exactly as before.

export function createCourseOutlineAIModel() {
  return getModel(MODELS.SMART).startChat({
    generationConfig: HIGH_REASONING_CONFIG,
    history: [
      {
        role: "user",
        parts: [
          {
            text: "Generate a study material for Python for  Exam and level of difficulty will be EASY with summery of course,List of Chapters along with summery for each chapter, Topic list in each chapter, All resule in JSON format\n\n",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: '{\n  "course_title": "Python for Beginners",\n  "difficulty": "Easy",\n  "chapters": []\n}',
          },
        ],
      },
    ],
  });
}

export function createNotesAiModel() {
  return getModel(MODELS.SMART).startChat({
    generationConfig: HIGH_REASONING_TEXT_CONFIG,
    history: [
      {
        role: "user",
        parts: [
          {
            text: "Generate exam material detail content for each chapter. Make sure to include structured headings and explanations in HTML format.",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "<h2>Introduction to Atoms</h2><h3>What are atoms?</h3><p>Atoms are the basic building blocks of matter...</p>",
          },
        ],
      },
    ],
  });
}

export function createFlashcardAiModel() {
  return getModel(MODELS.FAST).startChat({
    generationConfig: MEDIUM_REASONING_CONFIG,
    history: [
      {
        role: "user",
        parts: [
          {
            text: "Generate the flashcard on topic : Flutter Fundamentals,User Interface (UI) Development,Basic App Navigation in JSON format with front back content, Maximum 15",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: '[\n  {\n    "front": "What is a Widget in Flutter?",\n    "back": "A Widget is the basic building block of a Flutter UI."\n  }\n]',
          },
        ],
      },
    ],
  });
}

export function createQuizAiModel() {
  return getModel(MODELS.FAST).startChat({
    generationConfig: MEDIUM_REASONING_CONFIG,
    history: [
      {
        role: "user",
        parts: [
          {
            text: "Generate Quiz on topic : Flutter Fundamentals,User Interface (UI) Development,Basic App Navigation with Question and Options along with correct answer in JSON format",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: '{\n  "quizTitle": "Flutter Fundamentals",\n  "questions": []\n}',
          },
        ],
      },
    ],
  });
}

// Export the fallback instance for use in other parts of the application
export { geminiWithFallback };
