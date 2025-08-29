import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

export async function POST(req) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  const payload = await req.json();
  const headersList = headers();
  const heads = {
    "svix-id": headersList.get("svix-id"),
    "svix-timestamp": headersList.get("svix-timestamp"),
    "svix-signature": headersList.get("svix-signature"),
  };
  const wh = new Webhook(webhookSecret);
  let evt;

  try {
    evt = wh.verify(JSON.stringify(payload), heads);
  } catch (err) {
    console.error(err.message);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const eventType = evt.type;
  if (eventType === "user.created") {
    const { id, ...attributes } = evt.data;
    try {
      await inngest.send({
        name: "user.create",
        data: {
          user: {
            id,
            ...attributes,
          },
        },
      });
      return NextResponse.json({ success: true });
    } catch (inngestError) {
      console.error("Inngest error:", inngestError.message);
      return NextResponse.json({ 
        success: false, 
        message: "Failed to send user creation event",
        error: inngestError.message
      }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}