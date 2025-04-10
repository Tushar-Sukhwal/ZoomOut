"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/videoCallRoutes.ts
const express_1 = __importDefault(require("express"));
const videoCallController_1 = require("../controllers/videoCallController");
const router = express_1.default.Router();
// Routes for video call functionality
router.get("/", videoCallController_1.createMeeting);
router.get("/join", videoCallController_1.joinMeeting);
router.post("/leave", videoCallController_1.leaveMeeting);
exports.default = router;
