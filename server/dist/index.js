"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const websocketService_1 = require("./services/websocketService");
/* CONFIGURATION */
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
/* ROUTE IMPORTS */
const videoCallRoutes_1 = __importDefault(require("./routes/videoCallRoutes"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
/* ROUTES */
app.get("/", (req, res) => {
    res.send("This is Home route ");
});
// app.post("/", (req, res) => {
//   console.log("Received POST request to root path");
//   res.status(200).send("OK");
// });
app.use("/api/video-call", videoCallRoutes_1.default);
app.use("/", webhookRoutes_1.default);
// Start the WebSocket server for transcription
(0, websocketService_1.startWebSocketServer)();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
