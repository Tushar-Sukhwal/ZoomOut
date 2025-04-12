import { AudioStream, Room, RoomEvent, TrackKind } from "@livekit/rtc-node";
import { AccessToken } from "livekit-server-sdk";
import * as fs from "fs";
import { Buffer } from "buffer";
import path from "path";

// Global variables to track recording state
let recordingRoom: Room | null = null;
let currentWriter: fs.WriteStream | null = null;
let currentRoomId: string | null = null;

// Constants for WAV file
const BITS_PER_SAMPLE = 16;
const RECORDINGS_DIR = "../recordings";

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

function writeWavHeader(writer: fs.WriteStream, frame: any, filePath: string) {
  const header = Buffer.alloc(44);
  const byteRate = (frame.sampleRate * frame.channels * BITS_PER_SAMPLE) / 8;
  const blockAlign = (frame.channels * BITS_PER_SAMPLE) / 8;

  // Write the RIFF header
  header.write("RIFF", 0); // ChunkID
  header.writeUInt32LE(0, 4); // ChunkSize placeholder
  header.write("WAVE", 8); // Format

  // Write the fmt subchunk
  header.write("fmt ", 12); // Subchunk1ID
  header.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (PCM = 1)
  header.writeUInt16LE(frame.channels, 22); // NumChannels
  header.writeUInt32LE(frame.sampleRate, 24); // SampleRate
  header.writeUInt32LE(byteRate, 28); // ByteRate
  header.writeUInt16LE(blockAlign, 32); // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample

  // Write the data subchunk
  header.write("data", 36); // Subchunk2ID
  header.writeUInt32LE(0, 40); // Subchunk2Size placeholder

  // Write the header to the file
  fs.writeFileSync(filePath, header);
}

function updateWavHeader(filePath: string) {
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;

  const chunkSize = fileSize - 8;
  const subchunk2Size = fileSize - 44;
  const header = Buffer.alloc(8);
  header.writeUInt32LE(chunkSize, 0);
  header.writeUInt32LE(subchunk2Size, 4);

  // Update the file header
  const fd = fs.openSync(filePath, "r+");
  fs.writeSync(fd, header, 0, 4, 4); // Update ChunkSize
  fs.writeSync(fd, header, 4, 4, 40); // Update Subchunk2Size
  fs.closeSync(fd);
}

export const recordAudio = async (roomId: string) => {
  if (recordingRoom && currentRoomId === roomId) {
    console.log(`Already recording room ${roomId}`);
    return;
  }

  // Stop any existing recording
  if (recordingRoom) {
    await stopRecording();
  }

  const roomName = `room-${roomId}`;
  currentRoomId = roomId;

  // Create recorder token
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: `recorder-${roomId}-${Date.now()}`,
      ttl: "12h", // Long enough to record the session
    }
  );
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
    canPublish: false,
  });

  const jwt = await at.toJwt();
  const room = new Room();
  recordingRoom = room;

  const fileName = `recording-${roomId}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.wav`;
  const filePath = path.join(RECORDINGS_DIR, fileName);

  room.on(
    RoomEvent.TrackSubscribed,
    async (track, publication, participant) => {
      if (track.kind === TrackKind.KIND_AUDIO) {
        console.log(
          `Recording audio from ${participant.identity} in room ${roomId}`
        );

        const stream = new AudioStream(track);
        let firstFrame = true;

        for await (const frame of stream) {
          if (firstFrame) {
            // Create file and write header on first frame
            writeWavHeader(currentWriter!, frame, filePath);
            currentWriter = fs.createWriteStream(filePath, { flags: "a" }); // Append mode
            firstFrame = false;
          }

          if (currentWriter) {
            const buf = Buffer.from(frame.data.buffer);
            currentWriter.write(buf);
          }
        }
      }
    }
  );

  await room.connect(process.env.LIVEKIT_URL!, jwt, {
    autoSubscribe: true,
    dynacast: true,
  });

  console.log(`Started recording room ${roomId} to ${filePath}`);
};

export const stopRecording = async () => {
  if (!recordingRoom) return;

  console.log(`Stopping recording for room ${currentRoomId}`);

  if (currentWriter) {
    currentWriter.close();
    const fileName = path.basename(currentWriter.path.toString());
    updateWavHeader(path.join(RECORDINGS_DIR, fileName));
    currentWriter = null;
  }

  await recordingRoom.disconnect();
  recordingRoom = null;
  currentRoomId = null;
};
