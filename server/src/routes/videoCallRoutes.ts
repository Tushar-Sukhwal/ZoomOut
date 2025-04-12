// src/routes/videoCallRoutes.ts
import express from "express";
import {
  createMeeting,
  joinMeeting,
  leaveMeeting,
} from "../controllers/videoCallController";

const router = express.Router();

// Routes for video call functionality
router.post("/", createMeeting);
router.post("/join", joinMeeting);
router.post("/leave", leaveMeeting);

export default router;
