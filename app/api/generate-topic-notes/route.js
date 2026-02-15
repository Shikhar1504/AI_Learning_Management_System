import { generateNotesAiModel, geminiWithFallback } from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, TOPIC_TABLE } from "@/configs/schema";
import { and, eq } from "drizzle-orm";
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
      { status: 202 }
    );
  }

  // Update status to generating
  await db
    .update(TOPIC_TABLE)
    .set({ status: "generating", updatedAt: new Date() })
    .where(eq(TOPIC_TABLE.id, topicId));

  try {
    const PROMPT =
      "Generate structured study notes for the topic: " +
      topic.topicTitle +
      " from chapter: " +
      topic.chapterTitle +
      "\n" +
      "Rules:\n" +
      "- Keep total output under 600 words.\n" +
      "- Explanation max 150 words.\n" +
      "- No repetition.\n" +
      "- No flashcards.\n" +
      "- No chapter summary.\n" +
      "- Do not generate content for other topics.\n" +
      "- Format strictly in markdown:\n" +
      "## Explanation\n" +
      "(120-150 words max)\n" +
      "## Key Points\n" +
      "- 3 to 5 concise concise bullet points\n" +
      "## Code Example\n" +
      "(One small example only if relevant, use markdown code block)\n" +
      "## Interview Questions\n" +
      "- Question 1\n" +
      "- Question 2";

    // Call Gemini
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
        console.log("🔄 Primary API key overloaded for notes, trying fallback...");
        if (geminiWithFallback.switchToFallback()) {
            const fallbackModel = geminiWithFallback.getGenerativeModel({
              model: "gemini-2.5-flash",
            });
            
            const generationConfig2 = {
              temperature: 1,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 8192,
              responseMimeType: "text/plain",
            };

            const fallbackChat = fallbackModel.startChat({
              generationConfig: generationConfig2,
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
            
            geminiWithFallback.resetToPrimary();
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
      (t) => t.status === "completed"
    ).length;

    const progressPercentage =
      totalTopics > 0
        ? Math.round((completedTopics / totalTopics) * 100)
        : 0;

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
    console.error("Error generating topic notes:", error);

    // Reset status to pending on error
    await db
      .update(TOPIC_TABLE)
      .set({
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(TOPIC_TABLE.id, topicId));

    return NextResponse.json(
      { error: "Failed to generate notes" },
      { status: 500 }
    );
  }
}
