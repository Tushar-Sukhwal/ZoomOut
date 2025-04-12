import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL }),
  reducerPath: "api",
  tagTypes: [],
  endpoints: (build) => ({
    /**
     * Creates a new video call room
     * @param {string} name - Participant name
     * @param {string} roomId - Room ID to create
     * @returns {CreateCallResponse} - Response with token and room details
     */
    createCall: build.mutation<
      CreateCallResponse,
      { name: string; roomId: string }
    >({
      query: (body) => ({
        url: "/api/video-call",
        method: "POST",
        body,
      }),
    }),

    /**
     * Joins an existing video call room
     * @param {string} name - Participant name
     * @param {string} roomId - Room ID to join
     * @returns {JoinCallResponse} - Response with token and room details
     */
    joinCall: build.mutation<
      JoinCallResponse,
      { name: string; roomId: string }
    >({
      query: (body) => ({
        url: "/api/video-call/join",
        method: "POST",
        body,
      }),
    }),
  }),
});

// Response types
interface CreateCallResponse {
  success: boolean;
  token: string;
  roomId: string;
  expiresAt: string; // ISO 8601 timestamp
}

interface JoinCallResponse {
  success: boolean;
  token: string;
  roomId: string;
  participants: string[]; // Names of current participants
}

export const { useCreateCallMutation, useJoinCallMutation } = api;
