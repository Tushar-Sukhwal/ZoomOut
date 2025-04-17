// src/services/egressService.ts
import { EgressClient, StreamOutput, StreamProtocol } from "livekit-server-sdk";

const egressClient = new EgressClient(
  process.env.LIVEKIT_URL || "",
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

// Track active egress sessions
const activeEgress: Record<string, string> = {};

/**
 * Start room audio egress for transcription
 */
export const startRoomAudioEgress = async (
  roomName: string
): Promise<string> => {
  try {
    console.log(`Starting audio egress for room ${roomName}`);

    // Get the local server address for WebSocket connection
    const wsUrl = `ws://localhost:8001/audio/${roomName}/room`;

    // Create a proper StreamOutput instance
    const streamOutput = new StreamOutput({
      protocol: StreamProtocol.DEFAULT_PROTOCOL,
      urls: [wsUrl],
    });

    // Configure egress for room audio
    const egressInfo = await egressClient.startRoomCompositeEgress(
      roomName,
      {
        stream: streamOutput,
      },
      {
        audioOnly: true,
        layout: "speaker",
      }
    );

    const egressId = egressInfo.egressId;
    activeEgress[roomName] = egressId;

    console.log(
      `Started room audio egress for ${roomName}, egress ID: ${egressId}`
    );
    return egressId;
  } catch (error) {
    console.error("Error starting room audio egress:", error);
    throw error;
  }
};

/**
 * Start track egress for audio transcription
 */
export const startTrackEgress = async (
  roomName: string,
  trackId: string,
  websocketUrl: string
): Promise<string> => {
  try {
    console.log(`Starting track egress for ${trackId} in room ${roomName}`);

    // Start track egress with WebSocket output
    const egressInfo = await egressClient.startTrackEgress(
      roomName,
      trackId,
      websocketUrl
    );

    const egressId = egressInfo.egressId;
    activeEgress[`${roomName}-${trackId}`] = egressId;

    console.log(`Started track egress for ${trackId}, egress ID: ${egressId}`);
    return egressId;
  } catch (error) {
    console.error("Error starting track egress:", error);
    throw error;
  }
};

/**
 * Stop egress by ID
 */
export const stopEgress = async (egressId: string): Promise<void> => {
  try {
    await egressClient.stopEgress(egressId);
    console.log(`Stopped egress ID: ${egressId}`);

    // Remove from active egress tracking
    for (const key in activeEgress) {
      if (activeEgress[key] === egressId) {
        delete activeEgress[key];
        break;
      }
    }
  } catch (error) {
    console.error(`Error stopping egress ${egressId}:`, error);
    throw error;
  }
};

/**
 * Stop room egress
 */
export const stopRoomEgress = async (roomName: string): Promise<void> => {
  const egressId = activeEgress[roomName];

  if (!egressId) {
    console.log(`No active egress found for room ${roomName}`);
    return;
  }

  try {
    await egressClient.stopEgress(egressId);
    console.log(`Stopped egress for room ${roomName}, egress ID: ${egressId}`);
    delete activeEgress[roomName];
  } catch (error) {
    console.error(`Error stopping egress for room ${roomName}:`, error);
    throw error;
  }
};

/**
 * Check if a room has an active egress
 */
export const hasActiveEgress = (roomName: string): boolean => {
  return !!activeEgress[roomName];
};
