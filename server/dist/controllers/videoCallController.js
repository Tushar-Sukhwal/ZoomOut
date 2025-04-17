"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveMeeting = exports.joinMeeting = exports.createMeeting = void 0;
const livekit_1 = require("../config/livekit");
const egressService_1 = require("../services/egressService");
const roomService_1 = require("../services/roomService");
// Store active participants for each room
const roomParticipants = {};
// Handle creating a new meeting
// POST localhost:8000/api/video-call
const createMeeting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const token = yield (0, livekit_1.createToken)(name, roomId);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now
        // Get the LiveKit room name
        const roomName = (0, livekit_1.getRoomName)(roomId);
        // Explicitly create the room before starting egress
        yield (0, roomService_1.createRoomIfNotExists)(roomName);
        // Start egress and transcription for the room
        try {
            if (!(0, egressService_1.hasActiveEgress)(roomName)) {
                yield (0, egressService_1.startRoomAudioEgress)(roomName);
            }
        }
        catch (egressError) {
            console.error("Failed to start egress, but allowing meeting to continue:", egressError);
        }
        res.json({
            success: true,
            token,
            roomId,
            expiresAt,
            participants: Array.from(roomParticipants[roomId]),
        });
    }
    catch (error) {
        console.error("Error creating token:", error);
        res.status(500).json({ success: false, message: "Failed to create token" });
    }
});
exports.createMeeting = createMeeting;
// Handle joining an existing meeting
// POST localhost:8000/api/video-call/join
const joinMeeting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                message: "This name is already taken in this meeting. Please choose another name.",
            });
        }
        // Add participant to the room
        roomParticipants[roomId].add(name);
        // Create token for joining
        const token = yield (0, livekit_1.createToken)(name, roomId);
        // Get the LiveKit room name
        const roomName = (0, livekit_1.getRoomName)(roomId);
        // Ensure room exists in LiveKit
        yield (0, roomService_1.createRoomIfNotExists)(roomName);
        // Ensure egress is running for the room
        try {
            if (!(0, egressService_1.hasActiveEgress)(roomName)) {
                yield (0, egressService_1.startRoomAudioEgress)(roomName);
            }
        }
        catch (egressError) {
            console.error("Failed to start egress, but allowing meeting to continue:", egressError);
        }
        res.json({
            success: true,
            token,
            roomId,
            participants: Array.from(roomParticipants[roomId]),
        });
    }
    catch (error) {
        console.error("Error joining meeting:", error);
        res.status(500).json({ success: false, message: "Failed to join meeting" });
    }
});
exports.joinMeeting = joinMeeting;
// The leaveMeeting function remains unchanged
// Remove participant when they leave
// POST localhost:8000/api/video-call/leave
const leaveMeeting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("leave Meeting");
    const { name, roomId } = req.body;
    if (roomParticipants[roomId] && name) {
        roomParticipants[roomId].delete(name);
        // Clean up empty rooms and stop egress
        if (roomParticipants[roomId].size === 0) {
            try {
                const roomName = (0, livekit_1.getRoomName)(roomId);
                yield (0, egressService_1.stopRoomEgress)(roomName);
            }
            catch (error) {
                console.error(`Error stopping egress for room ${roomId}:`, error);
            }
            delete roomParticipants[roomId];
        }
    }
    res.json({ success: true });
});
exports.leaveMeeting = leaveMeeting;
