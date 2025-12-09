import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";

const http = httpRouter();

// Clerk webhook endpoint
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get the headers for verification
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    // Get the body
    const body = await request.text();

    // Verify the webhook
    const wh = new Webhook(webhookSecret);
    let evt: {
      type: string;
      data: {
        id: string;
        email_addresses?: Array<{ email_address: string }>;
        first_name?: string;
        last_name?: string;
        image_url?: string;
      };
    };

    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof evt;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Webhook verification failed", { status: 400 });
    }

    // Handle the event
    const eventType = evt.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      const email = email_addresses?.[0]?.email_address ?? "";
      const name = [first_name, last_name].filter(Boolean).join(" ") || email;

      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkId: id,
        email,
        name,
        imageUrl: image_url,
      });
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      await ctx.runMutation(internal.users.deleteFromClerk, {
        clerkId: id,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
