"use client";
import { ConnectionState, LiveKitRoom, VideoConference } from "@livekit/components-react";
import React from "react";

type Props = {
  token: string;
  serverUrl : string; 
};

const VideoRoom = ({
  token,
  serverUrl
}: Props) => {
  return (
    <div>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        video={true}
        audio={true}
        onConnected={() => console.log("Connected to LiveKit")}
        onDisconnected={(reason) =>
          console.log("Disconnected from LiveKit:", reason)
          
        }
        onError={(e) => console.error("LiveKit Error:", e)}

      >
        <ConnectionState />
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default VideoRoom;
