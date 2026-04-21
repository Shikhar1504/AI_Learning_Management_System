import { db } from "@/configs/db";
import { USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let data;
  let eventType;
  const webhookSecret = process.env.STRIPE_WEB_HOOK_KEY;

  if (webhookSecret) {
    const signature = req.headers.get("stripe-signature");
    const rawBody = await req.text();
    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
      data = event.data;
      eventType = event.type;
    } catch (err) {
      console.error("Webhook signature verification failed.", err);
      return new NextResponse("Bad Request", { status: 400 });
    }
  } else {
    const body = await req.json();
    data = body.data;
    eventType = body.type;
  }

  switch (eventType) {
    case "checkout.session.completed": {
      const email = data.object.customer_details?.email;
      if (!email) { console.warn("[Stripe] checkout.session.completed: no email found"); break; }
      const r1 = await db.update(USER_TABLE).set({ isMember: true }).where(eq(USER_TABLE.email, email)).returning();
      if (r1.length === 0) console.warn(`[Stripe] checkout.session.completed: no user found for email ${email}`);
      break;
    }
    case "invoice.paid": {
      const email = data.object.customer_email;
      if (!email) { console.warn("[Stripe] invoice.paid: no email found"); break; }
      const r2 = await db.update(USER_TABLE).set({ isMember: true }).where(eq(USER_TABLE.email, email)).returning();
      if (r2.length === 0) console.warn(`[Stripe] invoice.paid: no user found for email ${email}`);
      break;
    }
    case "customer.subscription.deleted": {
      const customerId = data.object.customer;
      const r3 = await db.update(USER_TABLE).set({ isMember: false }).where(eq(USER_TABLE.customerId, customerId)).returning();
      if (r3.length === 0) console.warn(`[Stripe] subscription.deleted: no user found for customerId ${customerId}`);
      break;
    }
    case "invoice.payment_failed": {
      const email = data.object.customer_details?.email;
      if (!email) { console.warn("[Stripe] invoice.payment_failed: no email found"); break; }
      const r4 = await db.update(USER_TABLE).set({ isMember: false }).where(eq(USER_TABLE.email, email)).returning();
      if (r4.length === 0) console.warn(`[Stripe] invoice.payment_failed: no user found for email ${email}`);
      break;
    }
    default:
      console.log(`[Stripe] Unhandled event type: ${eventType}`);
  }

  return NextResponse.json({ result: "success" });
}
