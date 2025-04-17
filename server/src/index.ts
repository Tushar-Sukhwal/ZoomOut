// src/index.ts
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { startWebSocketServer } from "./services/websocketService";

/* CONFIGURATION */
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/* ROUTE IMPORTS */
import videoCallRoutes from "./routes/videoCallRoutes";
import webhookRoutes from "./routes/webhookRoutes";

/* ROUTES */
app.get("/", (req, res) => {
  res.send("This is Home route ");
});

// app.post("/", (req, res) => {
//   console.log("Received POST request to root path");
//   res.status(200).send("OK");
// });

app.use("/api/video-call", videoCallRoutes);
app.use("/", webhookRoutes);

// Start the WebSocket server for transcription
startWebSocketServer();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
