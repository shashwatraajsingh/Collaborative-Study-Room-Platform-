export interface User {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  members?: RoomMember[];
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  role: 'owner' | 'member';
  user?: User;
}

export interface StudySession {
  id: string;
  roomId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  user?: User;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: User;
}

export interface DailyBreakdownItem {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  sessionCount: number;
}

export interface DashboardStats {
  totalStudyTimeSeconds: number;
  totalSessionsCount: number;
  roomsJoined: number;
  dailyBreakdown: DailyBreakdownItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode?: number;
}
