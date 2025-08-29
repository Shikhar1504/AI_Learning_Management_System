import { generateNotesAiModel } from "@/configs/AiModel";
import { db } from "@/configs/db";
import {
  CHAPTER_NOTES_TABLE,
  STUDY_MATERIAL_TABLE,
} from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Helper function to generate fallback content when AI API fails
function generateFallbackContent(chapter, courseType) {
  const { title, topics, summary } = chapter;
  
  // Create basic HTML content based on chapter information
  let content = `
    <div class="chapter-content">
      <h1>${title}</h1>
      <p class="summary"><strong>Summary:</strong> ${summary}</p>
      <div class="topics">
  `;
  
  // Add content for each topic
  topics.forEach(topic => {
    content += `
      <div class="topic">
        <h2>${topic}</h2>
        <p>This section covers key concepts related to ${topic} in the context of ${title}.</p>
        <div class="key-points">
          <h3>Key Points:</h3>
          <ul>
            <li>Understanding the fundamentals of ${topic}</li>
            <li>How ${topic} relates to ${title}</li>
            <li>Practical applications of ${topic}</li>
          </ul>
        </div>
    `;
    
    // Add example code if it might be a technical topic
    if (title.toLowerCase().includes("programming") || 
        title.toLowerCase().includes("code") || 
        title.toLowerCase().includes("development") ||
        title.toLowerCase().includes("machine learning") ||
        topic.toLowerCase().includes("code") ||
        topic.toLowerCase().includes("algorithm")) {
      content += `
        <div class="code-example">
          <h3>Example:</h3>
          <pre><code>
// Example code for ${topic}
function example${topic.replace(/\s+/g, '')}() {
  console.log("This is a placeholder for ${topic} code example");
  // Implementation would go here
  return "Example result";
}
          </code></pre>
        </div>
      `;
    }
    
    content += `
      </div>
    `;
  });
  
  content += `
      </div>
    </div>
  `;
  
  return content;
}

export async function POST(req) {
  try {
    const { courseId } = await req.json();
    
    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Get course from database
    const course = await db
      .select()
      .from(STUDY_MATERIAL_TABLE)
      .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

    if (course.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseData = course[0];
    console.log("Processing course:", courseData.topic);

    // Check if chapters already exist
    const existingChapters = await db
      .select()
      .from(CHAPTER_NOTES_TABLE)
      .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));

    if (existingChapters.length > 0) {
      // Update status to Ready if chapters exist
      await db
        .update(STUDY_MATERIAL_TABLE)
        .set({ status: "Ready" })
        .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));
      
      return NextResponse.json({ 
        message: "Chapters already exist, status updated to Ready",
        chapters: existingChapters.length
      });
    }

    // Generate Notes for Each Chapter using AI
    const chapters = courseData?.courseLayout?.chapters || [];
    console.log(`Generating content for ${chapters.length} chapters...`);
    
    let successCount = 0;
    
    for (let index = 0; index < chapters.length; index++) {
      const chapter = chapters[index];
      console.log(`Processing chapter ${index + 1}: ${chapter.title}`);
      
      // Construct the AI prompt
      const PROMPT =
        "Generate " +
        courseData?.courseType +
        " material detail content for each chapter. " +
        "Make sure to give notes for each topic from the chapters, " +
        "include code examples if applicable inside <pre><code> tags, " +
        "highlight key points, and style each tag appropriately. " +
        "Provide the response in HTML format (Do not include <html>, <head>, <body>, or <title> tags). " +
        "The chapter content is: " +
        JSON.stringify(chapter);

      // Add retry logic with exponential backoff
      let retries = 0;
      const maxRetries = 3;
      let aiResp = "";
      
      while (retries <= maxRetries) {
        try {
          // Call the AI model to generate notes
          const result = await generateNotesAiModel.sendMessage(PROMPT);
          aiResp = result.response.text();
          console.log(`✅ Successfully generated content for chapter: ${chapter.title}`);
          break;
        } catch (error) {
          console.error(`AI API Error (attempt ${retries + 1}/${maxRetries + 1}):`, error.message);
          
          if (retries === maxRetries) {
            // Generate fallback content on final retry
            console.log("Generating fallback content for chapter:", chapter.title);
            aiResp = generateFallbackContent(chapter, courseData?.courseType);
            break;
          }
          
          // Check if it's a rate limit error (429)
          if (error.message.includes("429") || error.message.includes("Too Many Requests")) {
            const delaySeconds = Math.pow(2, retries) * 5; // 5s, 10s, 20s
            console.log(`Rate limit hit. Waiting ${delaySeconds} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
          } else if (error.message.includes("503") || error.message.includes("500")) {
            // For server errors, wait a bit less
            const delaySeconds = Math.pow(1.5, retries) * 3; 
            console.log(`Server error. Waiting ${delaySeconds} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
          } else {
            // For other errors, use fallback content
            console.log("Unrecoverable error, using fallback content");
            aiResp = generateFallbackContent(chapter, courseData?.courseType);
            break;
          }
        }
        retries++;
        
        // Add delay between retries
        if (retries <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Store the generated notes in the database
      try {
        await db.insert(CHAPTER_NOTES_TABLE).values({
          chapterId: index,
          courseId: courseId,
          notes: aiResp,
        });
        successCount++;
        console.log(`✅ Saved chapter ${index + 1} to database`);
      } catch (error) {
        console.error(`Failed to save chapter ${index + 1}:`, error.message);
      }

      // Add delay between chapters to avoid rate limits (only if not the last chapter)
      if (index < chapters.length - 1) {
        console.log("Waiting 3 seconds before processing next chapter...");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Update Course Status to 'Ready' after generating notes
    await db
      .update(STUDY_MATERIAL_TABLE)
      .set({ status: "Ready" })
      .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

    console.log(`✅ Course generation completed! Generated ${successCount}/${chapters.length} chapters`);

    return NextResponse.json({ 
      success: true,
      message: `Successfully generated ${successCount}/${chapters.length} chapters`,
      courseId,
      chaptersGenerated: successCount,
      totalChapters: chapters.length
    });

  } catch (error) {
    console.error("Error generating chapters:", error);
    return NextResponse.json(
      { error: "Failed to generate chapters", details: error.message },
      { status: 500 }
    );
  }
}