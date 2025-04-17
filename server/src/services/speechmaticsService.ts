// src/services/speechmaticsService.ts
import WebSocket from "ws";
import { Readable } from "stream";

// Configuration for Speechmatics
const SPEECHMATICS_API_KEY = process.env.SPEECHMATICS_API_KEY || "";
const SPEECHMATICS_URL = "wss://eu2.rt.speechmatics.com/v2";

interface TranscriptionOptions {
  language?: string;
  enablePartials?: boolean;
  maxDelay?: number;
}

/**
 * Creates a Speechmatics transcription session
 */
export const createTranscriptionSession = (
  audioStream: Readable,
  options: TranscriptionOptions = {},
  onPartialTranscript: (text: string) => void,
  onFullTranscript: (text: string) => void
) => {
  const language = options.language || "en";
  const url = `${SPEECHMATICS_URL}/${language}`;

  // Connect to Speechmatics WebSocket
  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.log("Connected to Speechmatics WebSocket");

    // Send the StartRecognition message
    const startMessage = {
      message: "StartRecognition",
      audio_format: {
        type: "raw",
        encoding: "pcm_s16le",
        sample_rate: 16000,
      },
      transcription_config: {
        language,
        enable_partials: options.enablePartials !== false,
        max_delay: options.maxDelay || 2,
      },
    };

    ws.send(JSON.stringify(startMessage));

    // Start sending audio data
    audioStream.on("data", (chunk) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk);
      }
    });

    audioStream.on("end", () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ message: "EndOfStream" }));
      }
    });
  });

  // Handle messages from Speechmatics
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.message === "AddTranscript") {
        // Full transcript
        onFullTranscript(message.metadata.transcript);
      } else if (message.message === "AddPartialTranscript") {
        // Partial transcript
        onPartialTranscript(message.metadata.transcript);
      }
    } catch (error) {
      console.error("Error parsing Speechmatics message:", error);
    }
  });

  ws.on("error", (error) => {
    console.error("Speechmatics WebSocket error:", error);
  });

  ws.on("close", (code, reason) => {
    console.log(`Speechmatics WebSocket closed: ${code} - ${reason}`);
  });

  return {
    close: () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    },
  };
};
