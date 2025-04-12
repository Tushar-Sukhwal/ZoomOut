// src/controllers/videoCallController.ts
import { Request, Response } from "express";
import { AccessToken } from "livekit-server-sdk";

// Store active participants for each room
const roomParticipants: Record<string, Set<string>> = {};

// Create token for a new or existing room
export const createToken = async (participantName: string, roomId: string) => {
  const roomName = `room-${roomId}`;

  // Initialize room participants set if it doesn't exist
  if (!roomParticipants[roomId]) {
    roomParticipants[roomId] = new Set();
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantName,
      // Token to expire after 10 minutes
      ttl: "10m",
    }
  );
  at.addGrant({ roomJoin: true, room: roomName });



  return await at.toJwt();
};

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

    const token = await createToken(name, roomId);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

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

// Remove participant when they leave
// POST localhost:8000/api/video-call/leave
export const leaveMeeting = (req: Request, res: Response) => {
  console.log("leave Meeting");
  const { name, roomId } = req.body;

  if (roomParticipants[roomId] && name) {
    roomParticipants[roomId].delete(name);

    // Clean up empty rooms
    if (roomParticipants[roomId].size === 0) {
      delete roomParticipants[roomId];
    }
  }

  res.json({ success: true });
};



