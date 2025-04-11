// src/redux/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface MeetingResponse {
  success: boolean;
  token?: string;
  message?: string;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL }),
  reducerPath: "api",
  tagTypes: ["Meeting"],
  endpoints: (build) => ({
    createMeeting: build.query<string, { name: string; roomId: string }>({
      query: ({ name, roomId }) =>
        `/video?name=${encodeURIComponent(name)}&roomId=${encodeURIComponent(
          roomId
        )}`,
      transformResponse: (response: string) => response,
    }),

    joinMeeting: build.query<MeetingResponse, { name: string; roomId: string }>(
      {
        query: ({ name, roomId }) =>
          `/video/join?name=${encodeURIComponent(
            name
          )}&roomId=${encodeURIComponent(roomId)}`,
      }
    ),

    leaveMeeting: build.mutation<
      MeetingResponse,
      { name: string; roomId: string }
    >({
      query: ({ name, roomId }) => ({
        url: "/video/leave",
        method: "POST",
        body: { name, roomId },
      }),
    }),
  }),
});

export const {
  useLazyCreateMeetingQuery,
  useLazyJoinMeetingQuery,
  useLeaveMeetingMutation,
} = api;
