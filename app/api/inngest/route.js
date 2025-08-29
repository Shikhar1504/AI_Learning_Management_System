import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { CreateNewUser, GenerateNotes, GenerateStudyTypeContent, HandleRiseAppEvent } from "@/inngest/functions";
import { NextRequest, NextResponse } from "next/server";

// Use Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Add middleware to handle request parsing issues
async function validateRequest(req) {
  try {
    // Check if request has content-type header
    const contentType = req.headers.get('content-type');
    
    // Handle empty body or non-JSON requests gracefully
    if (!contentType || !contentType.includes('application/json')) {
      return { isValid: true, body: null };
    }
    
    // Try to read the body safely
    const bodyText = await req.text();
    
    // Handle empty body
    if (!bodyText || bodyText.trim() === '') {
      return { isValid: true, body: null };
    }
    
    // Validate JSON
    try {
      JSON.parse(bodyText);
      return { isValid: true, body: bodyText };
    } catch (parseError) {
      console.warn('JSON parsing failed, but continuing:', parseError.message);
      return { isValid: true, body: null };
    }
    
  } catch (error) {
    console.error('Request validation error:', error);
    return { isValid: false, error: error.message };
  }
}

// Configure serve with proper error handling
const handler = serve({
  client: inngest,
  streaming: "allow",
    functions: [
    CreateNewUser,
    GenerateNotes,
    GenerateStudyTypeContent,
    HandleRiseAppEvent,
  ],
  landingPage: false, // Disable landing page to reduce conflicts
});

// Wrap handlers with error handling
export async function GET(req) {
  try {
    return await handler.GET(req);
  } catch (error) {
    console.error('Inngest GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const validation = await validateRequest(req.clone());
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }
    
    return await handler.POST(req);
  } catch (error) {
    console.error('Inngest POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const validation = await validateRequest(req.clone());
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }
    
    return await handler.PUT(req);
  } catch (error) {
    console.error('Inngest PUT error:', error);
    // Return success even on parsing errors to prevent blocking Inngest
    console.warn('Continuing despite PUT error to maintain Inngest compatibility');
    return NextResponse.json(
      { success: true, message: 'Request processed despite parsing issues' },
      { status: 200 }
    );
  }
}
