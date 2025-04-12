"use client";

import React, { useState } from "react";
import { useCreateCallMutation, useJoinCallMutation } from "@/state/api";
import VideoRoom from "@/components/VideoRoom";
import toast from "react-hot-toast";

const Page = () => {
  const [name, setName] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [token, setToken] = useState<string>();
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [joinMeeting, { isLoading: isJoining }] = useJoinCallMutation();
  const [createMeeting, { isLoading: isCreating }] = useCreateCallMutation();


  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !roomId) {
      alert("Please enter both name and room ID");
      return;
    }

    try {
      const response = await createMeeting({ name, roomId });
      if ("data" in response && response.data?.success) {
        setToken(response.data.token);
        setIsJoined(true);
        toast.success("Meeting created successfully");
      } else {
        throw new Error("Failed to create meeting");
      }
    } catch (error) {
      toast.error("Error creating meeting");
      console.error("Create meeting error:", error);
    }
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !roomId) {
      alert("Please enter both name and room ID");
      return;
    }

    try {
      const response = await joinMeeting({ name, roomId });
      if ("data" in response && response.data?.success) {
        setToken(response.data.token);
        setIsJoined(true);
        toast.success("Joined meeting successfully");
      } else {
        throw new Error("Failed to join meeting");
      }
    } catch (error) {
      toast.error("Error joining meeting");
      console.error("Join meeting error:", error);
    }
  };

  if (!isJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-4">Start a Meeting</h1>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border m-2 p-2 rounded"
          />
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="border m-2 p-2 rounded"
          />
          <button
            onClick={handleCreateMeeting}
            disabled={isCreating}
            className="border m-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isCreating ? "Creating..." : "Start Meeting"}
          </button>
        </div>
        <div>
          <h1 className="text-xl font-bold mb-4">Join a Meeting</h1>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border m-2 p-2 rounded"
          />
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="border m-2 p-2 rounded"
          />
          <button
            onClick={handleJoinMeeting}
            disabled={isJoining}
            className="border m-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {isJoining ? "Joining..." : "Join Meeting"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <VideoRoom
        token={token!}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
      />
    </div>
  );
};

export default Page;
