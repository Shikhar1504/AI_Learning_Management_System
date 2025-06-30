import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { CreateNewUser, GenerateNotes, GenerateStudyTypeContent } from "@/inngest/functions";
export const runtime = "edge";
{
  /*This file sets up an API route (/api/inngest/route.js) that allows handling HTTP GET, POST, and PUT requests. 
  It connects the incoming requests to the CreateNewUser serverless function, which checks if a user exists in 
  the database and adds them if not. It enables the functionality of your provider by processing the request 
  triggered by the front-end.*/
}

export const { GET, POST, PUT } = serve({
  client: inngest,
  streaming: "allow",
  functions: [
    /* your functions will be passed here later! */
    CreateNewUser,
    GenerateNotes,
    GenerateStudyTypeContent,
  ],
});
