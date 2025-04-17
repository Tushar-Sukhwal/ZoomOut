// src/utils/roomUtils.ts
/**
 * Convert roomId to LiveKit room name format
 */
export const getRoomName = (roomId: string): string => {
  return `room-${roomId}`;
};
