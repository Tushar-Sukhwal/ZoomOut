// src/utils/fileUtils.ts
import fs from 'fs';
import path from 'path';

const RECORDINGS_DIR = './recordings';

/**
 * Ensures the recordings directory exists
 */
export const ensureRecordingsDirectory = (): void => {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  }
};

/**
 * Generate a unique filename for recordings
 */
export const generateRecordingFilename = (roomId: string, format: string = 'mp3'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(RECORDINGS_DIR, `${roomId}_${timestamp}.${format}`);
};
