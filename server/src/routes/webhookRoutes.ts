// src/routes/webhookRoutes.ts
import express from "express";
import { WebhookReceiver } from "livekit-server-sdk";

const router = express.Router();
const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

// Important: Use express.raw middleware for this route
router.post(
  "/",
  express.raw({ type: "application/webhook+json" }),
  async (req, res) => {
    try {
      // Validate and parse the webhook
      const event = await receiver.receive(
        req.body,
        req.headers.authorization as string
      );
      console.log(`Received webhook event: ${event.event}`);

      // Handle different event types
      switch (event.event) {
        case "participant_joined":
          console.log(`Participant joined: ${event.participant?.identity}`);
          break;
        case "track_published":
          console.log(`Track published: ${event.track?.sid}`);
          break;
        // Add more event handlers as needed
      }

      res.status(200).end();
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(400).json({ error: "Invalid webhook" });
    }
  }
);

export default router;
