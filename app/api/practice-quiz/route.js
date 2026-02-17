// import { db } from "@/configs/db";
// import { STUDY_MATERIAL_TABLE, STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
// import { eq, and, inArray } from "drizzle-orm";
// import { NextResponse } from "next/server";
// import { currentUser } from "@clerk/nextjs/server";

// /**
//  * Non-mutating Fisher-Yates shuffle
//  */
// function shuffleArray(array) {
//   const arr = [...array];
//   let currentIndex = arr.length;

//   while (currentIndex > 0) {
//     const randomIndex = Math.floor(Math.random() * currentIndex);
//     currentIndex--;

//     [arr[currentIndex], arr[randomIndex]] = [
//       arr[randomIndex],
//       arr[currentIndex],
//     ];
//   }

//   return arr;
// }

// export async function GET() {
//   try {
//     // 1️⃣ Authenticate user
//     const user = await currentUser();
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const userEmail = user.primaryEmailAddress?.emailAddress;
//     if (!userEmail) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // 2️⃣ Fetch user's created courses
//     const userCourses = await db
//       .select({ courseId: STUDY_MATERIAL_TABLE.courseId })
//       .from(STUDY_MATERIAL_TABLE)
//       .where(eq(STUDY_MATERIAL_TABLE.createdBy, userEmail));

//     if (!userCourses.length) {
//       return NextResponse.json({ questions: [] });
//     }

//     const courseIds = userCourses.map(c => c.courseId);

//     // 3️⃣ Fetch completed quiz content (STANDARDIZED: lowercase)
//     const quizContents = await db
//       .select()
//       .from(STUDY_TYPE_CONTENT_TABLE)
//       .where(
//         and(
//           eq(STUDY_TYPE_CONTENT_TABLE.type, "quiz"),
//           eq(STUDY_TYPE_CONTENT_TABLE.status, "completed"),
//           inArray(STUDY_TYPE_CONTENT_TABLE.courseId, courseIds)
//         )
//       );

//     if (!quizContents.length) {
//       return NextResponse.json({ questions: [] });
//     }

//     // 4️⃣ Extract & validate questions
//     let allQuestions = [];

//     for (const record of quizContents) {
//       const content = record.content;

//       let questions = [];

//       if (content?.questions && Array.isArray(content.questions)) {
//         questions = content.questions;
//       } else if (Array.isArray(content)) {
//         questions = content;
//       }

//       for (const q of questions) {
//         if (
//           q &&
//           typeof q.question === "string" &&
//           Array.isArray(q.options) &&
//           q.options.length >= 2 &&
//           q.correctAnswer !== undefined &&
//           q.options.includes(q.correctAnswer)
//         ) {
//           allQuestions.push(q);
//         }
//       }
//     }

//     if (!allQuestions.length) {
//       return NextResponse.json({ questions: [] });
//     }

//     // 5️⃣ Randomly select up to 10 questions
//     const shuffledQuestions = shuffleArray(allQuestions);
//     const selectedQuestions = shuffledQuestions.slice(0, 10);

//     // 6️⃣ Shuffle options + Map answer
//     const processedQuestions = selectedQuestions.map(q => {
//       const shuffledOptions = shuffleArray(q.options);
      
//       return {
//         question: q.question,
//         options: shuffledOptions,
//         answer: q.correctAnswer // REQUIRED: Send answer to frontend
//       };
//     });

//     return NextResponse.json({ questions: processedQuestions });

//   } catch (error) {
//     console.error("Practice quiz error:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Non-mutating Fisher-Yates shuffle
 */
function shuffleArray(array) {
  const arr = [...array];
  let currentIndex = arr.length;

  while (currentIndex > 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [
      arr[randomIndex],
      arr[currentIndex],
    ];
  }

  return arr;
}

export async function GET() {
  try {
    // 1️⃣ Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Fetch user's created courses
    const userCourses = await db
      .select({ courseId: STUDY_MATERIAL_TABLE.courseId })
      .from(STUDY_MATERIAL_TABLE)
      .where(eq(STUDY_MATERIAL_TABLE.createdBy, userEmail));

    if (!userCourses.length) {
      return NextResponse.json({ questions: [] });
    }

    const courseIds = userCourses.map(c => c.courseId);

    // 3️⃣ Fetch completed quiz content
    const quizContents = await db
      .select()
      .from(STUDY_TYPE_CONTENT_TABLE)
      .where(
        and(
          eq(STUDY_TYPE_CONTENT_TABLE.type, "quiz"),
          eq(STUDY_TYPE_CONTENT_TABLE.status, "completed"),
          inArray(STUDY_TYPE_CONTENT_TABLE.courseId, courseIds)
        )
      );

    if (!quizContents.length) {
      return NextResponse.json({ questions: [] });
    }

    // 4️⃣ Extract & validate questions
    let allQuestions = [];

    for (const record of quizContents) {
      const content = record.content;

      let questions = [];

      if (content?.questions && Array.isArray(content.questions)) {
        questions = content.questions;
      } else if (Array.isArray(content)) {
        questions = content;
      }

      for (const q of questions) {
        if (
          q &&
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          q.answer !== undefined &&              // ✅ FIXED
          q.options.includes(q.answer)           // ✅ FIXED
        ) {
          allQuestions.push(q);
        }
      }
    }

    if (!allQuestions.length) {
      return NextResponse.json({ questions: [] });
    }

    // 5️⃣ Shuffle and select up to 10
    const selectedQuestions = shuffleArray(allQuestions).slice(0, 10);

    // 6️⃣ Shuffle options but keep correct answer reference
    const processedQuestions = selectedQuestions.map(q => ({
      question: q.question,
      options: shuffleArray(q.options),
      answer: q.answer   // ✅ FIXED
    }));

    return NextResponse.json({ questions: processedQuestions });

  } catch (error) {
    console.error("Practice quiz error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
