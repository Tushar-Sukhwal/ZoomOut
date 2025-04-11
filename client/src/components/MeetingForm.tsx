// components/MeetingForm.tsx
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLazyCreateMeetingQuery, useLazyJoinMeetingQuery } from '@/state/api';

interface MeetingFormProps {
  onJoinSuccess: (token: string, roomId: string, userName: string) => void;
}

export default function MeetingForm({ onJoinSuccess }: MeetingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const queryRoomId = searchParams.get('roomId');
  const queryName = searchParams.get('name');
  
  const [name, setName] = useState(queryName || '');
  const [roomId, setRoomId] = useState(queryRoomId || Math.random().toString(36).substring(2, 8));
  const [error, setError] = useState<string | null>(null);

  // RTK Query hooks
  const [createMeeting, { isLoading: isCreating }] = useLazyCreateMeetingQuery();
  const [joinMeeting, { isLoading: isJoining }] = useLazyJoinMeetingQuery();
  
  const isLoading = isCreating || isJoining;

  const handleCreateMeeting = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setError(null);
    
    try {
      const token = await createMeeting({ name, roomId }).unwrap();
      
      if (token) {
        // Update URL with query parameters without refreshing
        const newUrl = `/video?roomId=${roomId}&name=${encodeURIComponent(name)}`;
        router.push(newUrl);
        
        onJoinSuccess(token, roomId, name);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError('Failed to create meeting. Please try again.');
    }
  };

  const handleJoinMeeting = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    setError(null);
    
    try {
      const response = await joinMeeting({ name, roomId }).unwrap();
      
      if (response.success && response.token) {
        // Update URL with query parameters without refreshing
        const newUrl = `/video?roomId=${roomId}&name=${encodeURIComponent(name)}`;
        router.push(newUrl);
        
        onJoinSuccess(response.token, roomId, name);
      } else {
        setError(response.message || 'Failed to join meeting');
      }
    } catch (error: any) {
      console.error('Error joining meeting:', error);
      setError(error?.data?.message || 'Failed to join meeting. Please try again.');
    }
  };

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
            Room ID
          </label>
          <div className="mt-1">
            <input
              id="roomId"
              name="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleCreateMeeting}
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? 'Loading...' : queryRoomId ? 'Join Meeting' : 'Create Meeting'}
          </button>
          
          {!queryRoomId && (
            <button
              type="button"
              onClick={handleJoinMeeting}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {isLoading ? 'Loading...' : 'Join Existing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}