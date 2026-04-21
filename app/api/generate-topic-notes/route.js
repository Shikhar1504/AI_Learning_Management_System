import {
  createNotesAiModel,
  geminiWithFallback,
  getModel,
  HIGH_REASONING_TEXT_CONFIG,
  MODELS,
} from "@/configs/AiModel";
import { TOPIC_NOTES_PROMPT } from "@/configs/prompts";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, TOPIC_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { topicId } = await req.json();

  if (!topicId) {
    return NextResponse.json({ error: "topicId is required" }, { status: 400 });
  }

  // Fetch topic
  const topicResult = await db
    .select()
    .from(TOPIC_TABLE)
    .where(eq(TOPIC_TABLE.id, topicId));

  if (!topicResult || topicResult.length === 0) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const topic = topicResult[0];

  // Status Guards
  if (topic.status === "completed") {
    return NextResponse.json({
      content: topic.notesContent,
      status: "completed",
      cached: true,
    });
  }

  if (topic.status === "generating") {
    // Return early to prevent duplicate calls
    return NextResponse.json(
      { message: "Generation in progress" },
      { status: 202 },
    );
  }

  // Allow retry if previously failed; reject any other unexpected state (e.g. unknown value)
  if (topic.status !== "pending" && topic.status !== "failed") {
    return NextResponse.json(
      { message: `Cannot generate notes for topic in state: ${topic.status}` },
      { status: 409 },
    );
  }

  // Update status to generating — state guard above ensures only pending/failed reaches here
  const updateResult = await db
    .update(TOPIC_TABLE)
    .set({ status: "generating", updatedAt: new Date() })
    .where(eq(TOPIC_TABLE.id, topicId))
    .returning({ id: TOPIC_TABLE.id });

  if (!updateResult || updateResult.length === 0) {
    return NextResponse.json(
      { message: "Topic is not in pending state or does not exist" },
      { status: 409 },
    );
  }

  try {
    const PROMPT = TOPIC_NOTES_PROMPT(topic.topicTitle, topic.chapterTitle);

    // Call Gemini — create a fresh session per request to avoid shared history
    const generateNotesAiModel = createNotesAiModel();
    let aiResp;
    let notesContent;

    try {
      aiResp = await generateNotesAiModel.sendMessage(PROMPT);
      notesContent = aiResp.response.text();
    } catch (error) {
      // Fallback logic
      if (
        geminiWithFallback.hasFallback() &&
        (error.message.includes("429") ||
          error.message.includes("Too Many Requests") ||
          error.message.includes("503") ||
          error.message.includes("Resource has been exhausted"))
      ) {
        console.log(
          "🔄 Primary API key overloaded for notes, trying fallback...",
        );
        if (geminiWithFallback.switchToFallback()) {
          try {
            // Fallback fix: retry with the SAME model/config, only API key switches.
            const fallbackModel = getModel(MODELS.SMART);

            const fallbackChat = fallbackModel.startChat({
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
                      text: `<h2>Introduction to Atoms</h2>
                             <h3>What are atoms?</h3>
                             <p>Atoms are the basic building blocks of matter...</p>`,
                    },
                  ],
                },
              ],
            });

            aiResp = await fallbackChat.sendMessage(PROMPT);
            notesContent = aiResp.response.text();
            console.log("✅ Successfully used fallback API key for notes");
          } finally {
            geminiWithFallback.resetToPrimary();
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // Update DB with content
    await db
      .update(TOPIC_TABLE)
      .set({
        notesContent: notesContent,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(TOPIC_TABLE.id, topicId));

    // Recalculate course progress
    const topics = await db
      .select()
      .from(TOPIC_TABLE)
      .where(eq(TOPIC_TABLE.courseId, topic.courseId));

    const totalTopics = topics.length;
    const completedTopics = topics.filter(
      (t) => t.status === "completed",
    ).length;

    const progressPercentage =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    await db
      .update(STUDY_MATERIAL_TABLE)
      .set({
        totalTopics,
        completedTopics,
        progressPercentage,
      })
      .where(eq(STUDY_MATERIAL_TABLE.courseId, topic.courseId));

    return NextResponse.json({
      content: notesContent,
      status: "completed",
    });
  } catch (error) {
    console.error(`[Topic ${topicId}] Error generating topic notes:`, error);

    await db
      .update(TOPIC_TABLE)
      .set({
        status: "failed",
        error: error.message || "Failed to generate notes",
        updatedAt: new Date(),
      })
      .where(eq(TOPIC_TABLE.id, topicId));

    return NextResponse.json(
      { error: error.message || "Failed to generate notes" },
      { status: 500 },
    );
  }
}
