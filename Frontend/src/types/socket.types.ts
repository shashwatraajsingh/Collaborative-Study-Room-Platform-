export interface JoinRoomPayload {
  roomId: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface SendMessagePayload {
  roomId: string;
  content: string;
}

export interface StartSessionPayload {
  roomId: string;
}

export interface EndSessionPayload {
  roomId: string;
}

// Server -> Client Events payload
export interface UserJoinedPayload {
  userId: string;
  username: string;
  roomId: string;
}

export interface UserLeftPayload {
  userId: string;
  username: string;
  roomId: string;
}

export interface PresenceUpdatePayload {
  roomId: string;
  onlineUsers: Array<{
    userId: string;
    username: string;
  }>;
}

export interface NewMessagePayload {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface SessionStartedPayload {
  userId: string;
  roomId: string;
  startedAt: string;
}

export interface SessionEndedPayload {
  userId: string;
  roomId: string;
  durationSeconds: number;
}
