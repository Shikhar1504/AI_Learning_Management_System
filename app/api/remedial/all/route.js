import { db } from "@/configs/db";
import {
  REMEDIAL_CONTENT_TABLE,
  STUDY_TYPE_CONTENT_TABLE,
  USER_TABLE,
} from "@/configs/schema";
import { eq, desc, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // 1. Get logged-in user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.primaryEmailAddress?.emailAddress;

    // 2. Map to DB user
    const dbUser = await db
      .select({ id: USER_TABLE.id })
      .from(USER_TABLE)
      .where(eq(USER_TABLE.email, email))
      .limit(1);

    if (dbUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = dbUser[0].id;

    // 3. Get remedial jobs (optionally filtered by courseId)
    const { searchParams } = new URL(request.url);
    const courseIdFilter = searchParams.get("courseId");

    let remedialQuery = db
      .select()
      .from(REMEDIAL_CONTENT_TABLE)
      .where(eq(REMEDIAL_CONTENT_TABLE.userId, userId))
      .orderBy(desc(REMEDIAL_CONTENT_TABLE.createdAt));

    // If courseId provided, filter to that course
    if (courseIdFilter) {
      remedialQuery = db
        .select()
        .from(REMEDIAL_CONTENT_TABLE)
        .where(
          and(
            eq(REMEDIAL_CONTENT_TABLE.userId, userId),
            eq(REMEDIAL_CONTENT_TABLE.courseId, courseIdFilter),
          ),
        )
        .orderBy(desc(REMEDIAL_CONTENT_TABLE.createdAt));
    }

    const remedial = courseIdFilter
      ? await remedialQuery.limit(1)
      : await remedialQuery;

    if (remedial.length === 0) {
      return NextResponse.json({ data: courseIdFilter ? null : [] });
    }

    // If courseId provided, return single item; otherwise return array
    if (courseIdFilter) {
      const latest = remedial[0];

      // 4. Get matching study content (type = remedial)
      const study = await db
        .select()
        .from(STUDY_TYPE_CONTENT_TABLE)
        .where(
          and(
            eq(STUDY_TYPE_CONTENT_TABLE.courseId, latest.courseId),
            eq(STUDY_TYPE_CONTENT_TABLE.type, "remedial"),
          ),
        )
        .orderBy(desc(STUDY_TYPE_CONTENT_TABLE.id))
        .limit(1);

      if (study.length === 0) {
        return NextResponse.json({
          data: {
            metadata: latest,
            content: null,
          },
        });
      }

      // 5. Parse JSON content
      let parsedContent = null;
      try {
        parsedContent =
          typeof study[0].content === "string"
            ? JSON.parse(study[0].content)
            : study[0].content;
      } catch (err) {
        console.error("JSON parse failed", err);
      }

      // 6. Return combined response
      return NextResponse.json({
        data: {
          metadata: latest,
          content: parsedContent,
        },
      });
    } else {
      // Return array of all remedial items for list view
      const items = await Promise.all(
        remedial.map(async (rem) => {
          const study = await db
            .select()
            .from(STUDY_TYPE_CONTENT_TABLE)
            .where(
              and(
                eq(STUDY_TYPE_CONTENT_TABLE.courseId, rem.courseId),
                eq(STUDY_TYPE_CONTENT_TABLE.type, "remedial"),
              ),
            )
            .orderBy(desc(STUDY_TYPE_CONTENT_TABLE.id))
            .limit(1);

          let parsedContent = null;
          if (study.length > 0) {
            try {
              parsedContent =
                typeof study[0].content === "string"
                  ? JSON.parse(study[0].content)
                  : study[0].content;
            } catch (err) {
              console.error("JSON parse failed", err);
            }
          }

          return {
            metadata: rem,
            content: parsedContent,
          };
        }),
      );

      return NextResponse.json({ data: items });
    }
  } catch (error) {
    console.error("Remedial API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch remedial data" },
      { status: 500 },
    );
  }
}
