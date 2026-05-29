import { create } from 'zustand';
import { Message, StudySession } from '../types/api.types';

interface RoomState {
  messages: Message[];
  onlineUsers: Array<{ userId: string; username: string }>;
  activeSession: StudySession | null;
  sessionsHistory: StudySession[];
  isConnected: boolean;

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setOnlineUsers: (users: Array<{ userId: string; username: string }>) => void;
  setActiveSession: (session: StudySession | null) => void;
  setSessionsHistory: (sessions: StudySession[]) => void;
  addSessionToHistory: (session: StudySession) => void;
  setIsConnected: (connected: boolean) => void;
  clearRoomStore: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  messages: [],
  onlineUsers: [],
  activeSession: null,
  sessionsHistory: [],
  isConnected: false,

  setMessages: (messages) => {
    set({ messages });
  },

  addMessage: (message) => {
    set((state) => {
      // Avoid duplicate messages if they arrive twice (e.g. from rapid triggers or reconnects)
      if (state.messages.some((m) => m.id === message.id)) {
        return state;
      }
      return { messages: [...state.messages, message] };
    });
  },

  setOnlineUsers: (onlineUsers) => {
    set({ onlineUsers });
  },

  setActiveSession: (activeSession) => {
    set({ activeSession });
  },

  setSessionsHistory: (sessionsHistory) => {
    set({ sessionsHistory });
  },

  addSessionToHistory: (session) => {
    set((state) => {
      // Insert at index 0 because session list is usually descending order
      if (state.sessionsHistory.some((s) => s.id === session.id)) {
        return state;
      }
      return { sessionsHistory: [session, ...state.sessionsHistory].slice(0, 5) };
    });
  },

  setIsConnected: (isConnected) => {
    set({ isConnected });
  },

  clearRoomStore: () => {
    set({
      messages: [],
      onlineUsers: [],
      activeSession: null,
      sessionsHistory: [],
      isConnected: false,
    });
  },
}));
