// src/config/livekit.ts
import { AccessToken } from "livekit-server-sdk";

// Create token for a new or existing room
export const createToken = async (participantName: string, roomId: string) => {
  const roomName = `room-${roomId}`;

  // Check for required environment variables
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Missing required LiveKit environment variables");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    // Token to expire after 10 minutes
    ttl: "10m",
  });
  at.addGrant({ roomJoin: true, room: roomName });

  return await at.toJwt();
};

// Convert roomId to LiveKit room name format
export const getRoomName = (roomId: string): string => {
  return `room-${roomId}`;
};
