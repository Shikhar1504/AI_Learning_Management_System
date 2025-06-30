import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE } from "@/configs/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { createdBy } = await req.json();
  //req.json() parses the incoming JSON request body.
  //{ createdBy } extracts the createdBy field (email).
  const result = await db
    .select()
    .from(STUDY_MATERIAL_TABLE)
    .where(eq(STUDY_MATERIAL_TABLE.createdBy, createdBy))
    .orderBy(desc(STUDY_MATERIAL_TABLE.id));
  return NextResponse.json({ result: result });
}

{
  /* Purpose:
Retrieves all study materials created by a specific user (createdBy).
Orders them by id in descending order (newest first).
Returns the result as a JSON response.

How it Works:
Extracts createdBy from the request body (req.json()).
Queries the database (STUDY_MATERIAL_TABLE) to find records where createdBy matches.
Sorts results in descending order by id.
Sends the results as a JSON response. */
}

export async function GET(req) {
  const reqUrl = req.url;
  const { searchParams } = new URL(reqUrl);
  const courseId = searchParams?.get("courseId");

  const course = await db
    .select()
    .from(STUDY_MATERIAL_TABLE)
    .where(eq(STUDY_MATERIAL_TABLE?.courseId, courseId));

  return NextResponse.json({ result: course[0] });
}

{
  /*Purpose:
Retrieves a single study material by courseId.
Returns the first matching record.

How it Works:
Extracts the courseId from the query string (searchParams.get("courseId")).
Queries the database (STUDY_MATERIAL_TABLE) to find records where courseId matches.
Returns the first matching result as JSON. */
}
