// src/controllers/webhookController.ts
import { Request, Response } from "express";
import { WebhookReceiver } from "livekit-server-sdk";
import { startTrackEgress, stopEgress } from "../services/egressService";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // Validate and parse the webhook
    const event = await receiver.receive(
      req.body,
      req.headers.authorization as string
    );
    console.log(`Received webhook event: ${event.event}`);

    switch (event.event) {
      case "participant_joined":
        // A participant joined the room
        await handleParticipantJoined(event);
        break;

      case "track_published":
        // A participant published a track (audio/video)
        await handleTrackPublished(event);
        break;

      case "egress_started":
        console.log(`Egress started: ${event.egressInfo?.egressId}`);
        break;

      case "egress_ended":
        console.log(`Egress ended: ${event.egressInfo?.egressId}`);
        break;

      case "room_finished":
        // Room is finished, clean up any resources
        await handleRoomFinished(event);
        break;
      
    }

    res.status(200).end();
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(400).json({ error: "Invalid webhook" });
  }
};

// Handle participant joined event
async function handleParticipantJoined(event: any) {
  const roomName = event.room?.name;
  const participantIdentity = event.participant?.identity;

  if (roomName && participantIdentity) {
    console.log(`Participant ${participantIdentity} joined room ${roomName}`);
  }
}

// Handle track published event - start transcription for audio tracks
async function handleTrackPublished(event: any) {
  const roomName = event.room?.name;
  const participantIdentity = event.participant?.identity;
  const trackId = event.track?.sid;
  const trackType = event.track?.type;

  // Only process audio tracks
  if (roomName && trackId && trackType === "audio") {
    console.log(
      `Audio track ${trackId} published by ${participantIdentity} in room ${roomName}`
    );

    try {
      // Start track egress with WebSocket for transcription
      await startTrackEgress(
        roomName,
        trackId,
        `ws://your-server.com/egress/${roomName}/${trackId}`
      );
      console.log(`Started transcription for track ${trackId}`);
    } catch (error) {
      console.error(
        `Failed to start transcription for track ${trackId}:`,
        error
      );
    }
  }
}

// Handle room empty event
async function handleRoomFinished(event: any) {
  const roomName = event.room?.name;

  if (roomName) {
    console.log(`Room ${roomName} is now empty`);
    // Clean up any active egress for this room
    // This could involve looking up active egress IDs and stopping them
  }
}
