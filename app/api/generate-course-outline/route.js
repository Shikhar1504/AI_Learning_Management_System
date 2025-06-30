import { courseOutlineAIModel } from "@/configs/AiModel";
import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { courseId, topic, courseType, difficultyLevel, createdBy } =
    await req.json();

  {
  /*It extracts the request body fields:
  courseId → Unique ID for the course
  topic → The topic of the study material (e.g., "React Development")
  courseType → Type of course (e.g., "Programming")
  difficultyLevel → How difficult the course should be (e.g., "Intermediate")
  createdBy → The email of the user who created the course*/
  }

  const PROMPT =
    "Generate a study material for " +
    topic +
    " for " +
    courseType +
    " and level of difficulty  will be " +
    difficultyLevel +
    " with summary of course, List of Chapters (Max 3) along with summary and Emoji icon for each chapter, Topic list in each chapter, and all result in  JSON format";
  // Generate Course Layout using AI
  const aiResp = await courseOutlineAIModel.sendMessage(PROMPT);
  const aiResult = JSON.parse(aiResp.response.text());

  // Save the result along with User Input
  console.log("Inserting data into the database...");
  const dbResult = await db
    .insert(STUDY_MATERIAL_TABLE)
    .values({
      courseId: courseId,
      courseType: courseType,
      createdBy: createdBy,
      topic: topic,
      courseLayout: aiResult,
    })
    .returning({ resp: STUDY_MATERIAL_TABLE });
  console.log("Database insertion successful:", dbResult);

  //Trigger the Inngest function to generate chapter notes
  inngest.send({
    name: "notes.generate",
    data: {
      course: dbResult[0].resp,
    },
  });
  return NextResponse.json({ result: dbResult[0] });
}
