// src/controllers/videoCallController.ts
import { Request, Response } from "express";
import { createToken, getRoomName } from "../config/livekit";
import {
  startRoomAudioEgress,
  stopRoomEgress,
  hasActiveEgress,
} from "../services/egressService";
import { createRoomIfNotExists } from "../services/roomService";

// Store active participants for each room
const roomParticipants: Record<string, Set<string>> = {};

// Handle creating a new meeting
// POST localhost:8000/api/video-call
export const createMeeting = async (
  req: Request,
  res: Response
): Promise<any> => {
  console.log("create Meeting");
  try {
    const { name = "Anonymous", roomId } = req.body;

    if (!roomId) {
      return res
        .status(400)
        .json({ success: false, message: "Room ID is required" });
    }

    // Initialize the room and add the first participant
    if (!roomParticipants[roomId]) {
      roomParticipants[roomId] = new Set();
    }
    roomParticipants[roomId].add(name);

    // Create token for the participant
    const token = await createToken(name, roomId);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    // Get the LiveKit room name
    const roomName = getRoomName(roomId);

    // Explicitly create the room before starting egress
    await createRoomIfNotExists(roomName);

    // Start egress and transcription for the room
    try {
      if (!hasActiveEgress(roomName)) {
        await startRoomAudioEgress(roomName);
      }
    } catch (egressError) {
      console.error(
        "Failed to start egress, but allowing meeting to continue:",
        egressError
      );
    }

    res.json({
      success: true,
      token,
      roomId,
      expiresAt,
      participants: Array.from(roomParticipants[roomId]),
    });
  } catch (error) {
    console.error("Error creating token:", error);
    res.status(500).json({ success: false, message: "Failed to create token" });
  }
};

// Handle joining an existing meeting
// POST localhost:8000/api/video-call/join
export const joinMeeting = async (
  req: Request,
  res: Response
): Promise<any> => {
  console.log("Join Meeting");
  try {
    const { name, roomId } = req.body;

    if (!name || !roomId) {
      return res.status(400).json({
        success: false,
        message: "Both name and roomId are required",
      });
    }

    // Check if room exists
    if (!roomParticipants[roomId]) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Check if name is already taken
    if (roomParticipants[roomId].has(name)) {
      return res.status(409).json({
        success: false,
        message:
          "This name is already taken in this meeting. Please choose another name.",
      });
    }

    // Add participant to the room
    roomParticipants[roomId].add(name);

    // Create token for joining
    const token = await createToken(name, roomId);

    // Get the LiveKit room name
    const roomName = getRoomName(roomId);

    // Ensure room exists in LiveKit
    await createRoomIfNotExists(roomName);

    // Ensure egress is running for the room
    try {
      if (!hasActiveEgress(roomName)) {
        await startRoomAudioEgress(roomName);
      }
    } catch (egressError) {
      console.error(
        "Failed to start egress, but allowing meeting to continue:",
        egressError
      );
    }

    res.json({
      success: true,
      token,
      roomId,
      participants: Array.from(roomParticipants[roomId]),
    });
  } catch (error) {
    console.error("Error joining meeting:", error);
    res.status(500).json({ success: false, message: "Failed to join meeting" });
  }
};

// The leaveMeeting function remains unchanged

// Remove participant when they leave
// POST localhost:8000/api/video-call/leave
export const leaveMeeting = async (req: Request, res: Response) => {
  console.log("leave Meeting");
  const { name, roomId } = req.body;

  if (roomParticipants[roomId] && name) {
    roomParticipants[roomId].delete(name);

    // Clean up empty rooms and stop egress
    if (roomParticipants[roomId].size === 0) {
      try {
        const roomName = getRoomName(roomId);
        await stopRoomEgress(roomName);
      } catch (error) {
        console.error(`Error stopping egress for room ${roomId}:`, error);
      }

      delete roomParticipants[roomId];
    }
  }

  res.json({ success: true });
};
