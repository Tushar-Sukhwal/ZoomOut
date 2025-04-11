// components/VideoRoom.tsx
import React, { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useRouter } from "next/navigation";
import { useLeaveMeetingMutation } from "@/state/api";

interface VideoRoomProps {
  token: string;
  roomId: string;
  userName: string;
  onLeave?: () => void;
}

export default function VideoRoom({
  token,
  roomId,
  userName,
  onLeave,
}: VideoRoomProps) {
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);
  const [leaveMeeting] = useLeaveMeetingMutation();

  const serverUrl =
    process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    "wss://your-livekit-server.livekit.cloud";

  const handleDisconnect = async () => {
    try {
      await leaveMeeting({ name: userName, roomId }).unwrap();
    } catch (error) {
      console.error("Error leaving room:", error);
    } finally {
      if (onLeave) {
        onLeave();
      } else {
        router.push("/");
      }
    }
  };

  const copyMeetingLink = () => {
    const link = `${window.location.origin}/video?roomId=${roomId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Meeting: {roomId}</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={copyMeetingLink}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
          >
            {isCopied ? "Link Copied!" : "Copy Meeting Link"}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-900">
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          onDisconnected={handleDisconnect}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
