import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useRoomStore } from '../store/room.store';
import {
  NewMessagePayload,
  PresenceUpdatePayload,
  SessionStartedPayload,
  SessionEndedPayload,
} from '../types/socket.types';

export const useSocket = (roomId: string) => {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const {
    addMessage,
    setOnlineUsers,
    setActiveSession,
    setIsConnected,
  } = useRoomStore();

  useEffect(() => {
    if (!roomId || !accessToken) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    // Connect to the /rooms namespace
    const socket = io(`${socketUrl}/rooms`, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Emit joinRoom with { roomId, token } as requested
      socket.emit('joinRoom', { roomId, token: accessToken });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    socket.on('newMessage', (payload: NewMessagePayload) => {
      if (payload.roomId === roomId) {
        addMessage({
          id: payload.id,
          roomId: payload.roomId,
          userId: payload.userId,
          content: payload.content,
          createdAt: payload.createdAt,
          user: {
            id: payload.userId,
            email: '',
            username: payload.username,
          },
        });
      }
    });

    socket.on('presenceUpdate', (payload: PresenceUpdatePayload) => {
      if (payload.roomId === roomId) {
        setOnlineUsers(payload.onlineUsers);
      }
    });

    socket.on('sessionStarted', (payload: SessionStartedPayload) => {
      if (payload.roomId === roomId) {
        setActiveSession({
          id: '', // Will be updated on subsequent REST fetches
          roomId: payload.roomId,
          userId: payload.userId,
          startedAt: payload.startedAt,
          endedAt: null,
          durationSeconds: null,
        });
      }
    });

    socket.on('sessionEnded', (payload: SessionEndedPayload) => {
      if (payload.roomId === roomId) {
        setActiveSession(null);
      }
    });

    return () => {
      if (socket) {
        socket.emit('leaveRoom', { roomId });
        socket.disconnect();
      }
      setIsConnected(false);
    };
  }, [roomId, accessToken, addMessage, setOnlineUsers, setActiveSession, setIsConnected]);

  const sendMessage = (content: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', { roomId, content });
    }
  };

  const startSession = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('startSession', { roomId });
    }
  };

  const endSession = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('endSession', { roomId });
    }
  };

  return {
    sendMessage,
    startSession,
    endSession,
  };
};
