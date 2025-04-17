// src/services/websocketService.ts
import WebSocket, { Server } from "ws";
import { createServer } from "http";
import { Readable } from "stream";

// Create HTTP server and WebSocket server
const httpServer = createServer();
const wss = new Server({ noServer: true });

// Setup the WebSocket server to receive audio from LiveKit
wss.on("connection", (ws, req) => {
  const url = req.url || "";
  const match = url.match(/\/egress\/([^\/]+)\/([^\/]+)/);

  if (!match) {
    console.error("Invalid WebSocket URL format:", url);
    ws.close();
    return;
  }

  const [, roomName, trackId] = match;
  const sessionKey = `${roomName}-${trackId}`;
  console.log(`WebSocket connection established for ${sessionKey}`);

  // Create a connection to Speechmatics
  const speechmaticsWs = new WebSocket("wss://eu2.rt.speechmatics.com/v2/en");

  speechmaticsWs.on("open", () => {
    console.log(`Connected to Speechmatics for ${sessionKey}`);

    // Send the StartRecognition message
    const startMessage = {
      message: "StartRecognition",
      auth_token: process.env.SPEECHMATICS_API_KEY,
      audio_format: {
        type: "raw",
        encoding: "pcm_s16le",
        sample_rate: 16000,
      },
      transcription_config: {
        language: "en",
        enable_partials: true,
        max_delay: 2,
      },
    };

    speechmaticsWs.send(JSON.stringify(startMessage));
  });

  // Handle messages from LiveKit (audio data)
  ws.on("message", (data) => {
    // Forward to Speechmatics if connection is open
    if (speechmaticsWs.readyState === WebSocket.OPEN) {
      speechmaticsWs.send(data);
    }
  });

  // Handle messages from Speechmatics (transcription results)
  speechmaticsWs.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.message === "AddTranscript") {
        // Full transcript
        console.log(`[${sessionKey}] [Full] ${message.metadata.transcript}`);
      } else if (message.message === "AddPartialTranscript") {
        // Partial transcript
        console.log(`[${sessionKey}] [Partial] ${message.metadata.transcript}`);
      }
    } catch (error) {
      console.error("Error parsing Speechmatics message:", error);
    }
  });

  // Handle WebSocket close
  ws.on("close", () => {
    console.log(`WebSocket connection closed for ${sessionKey}`);

    // Send EndOfStream to Speechmatics
    if (speechmaticsWs.readyState === WebSocket.OPEN) {
      speechmaticsWs.send(JSON.stringify({ message: "EndOfStream" }));
    }
  });

  // Handle Speechmatics WebSocket close
  speechmaticsWs.on("close", (code, reason) => {
    console.log(
      `Speechmatics WebSocket closed for ${sessionKey}: ${code} - ${reason}`
    );
  });
});

// Handle HTTP server upgrade (WebSocket handshake)
httpServer.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Start the WebSocket server
export const startWebSocketServer = (port: number = 8001) => {
  httpServer.listen(port, () => {
    console.log(`WebSocket server for transcription listening on port ${port}`);
  });
};
