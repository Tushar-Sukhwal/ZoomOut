// src/services/roomService.ts
import { RoomServiceClient } from "livekit-server-sdk";

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL || "",
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

/**
 * Check if a room exists
 */
export const roomExists = async (roomName: string): Promise<boolean> => {
  try {
    // Change this line - pass the array directly instead of an object
    const rooms = await roomService.listRooms([roomName]);
    return rooms.length > 0;
  } catch (error) {
    console.error("Error checking if room exists:", error);
    return false;
  }
};

/**
 * Create a room if it doesn't exist
 */
export const createRoomIfNotExists = async (
  roomName: string
): Promise<void> => {
  try {
    const exists = await roomExists(roomName);
    if (!exists) {
      console.log(`Creating room ${roomName}`);
      await roomService.createRoom({
        name: roomName,
        // Optional: configure other room settings
        emptyTimeout: 10 * 60, // 10 minutes
      });
    }
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};
