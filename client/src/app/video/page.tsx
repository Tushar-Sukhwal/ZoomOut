// app/video/page.tsx
"use client";

import React, { useState } from "react";
import Head from "next/head";
import MeetingForm from "@/components/MeetingForm";
import VideoRoom from "@/components/VideoRoom";

export default function VideoPage() {
  const [activeSession, setActiveSession] = useState<{
    token: string;
    roomId: string;
    userName: string;
  } | null>(null);

  const handleJoinSuccess = (
    token: string,
    roomId: string,
    userName: string
  ) => {
    setActiveSession({ token, roomId, userName });
  };

  const handleLeaveCall = () => {
    setActiveSession(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Video Call App</title>
        <meta name="description" content="Simple video calling application" />
      </Head>

      {activeSession ? (
        <VideoRoom
          token={activeSession.token}
          roomId={activeSession.roomId}
          userName={activeSession.userName}
          onLeave={handleLeaveCall}
        />
      ) : (
        <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h1 className="text-center text-3xl font-extrabold text-gray-900">
              Video Call App
            </h1>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <MeetingForm onJoinSuccess={handleJoinSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}
