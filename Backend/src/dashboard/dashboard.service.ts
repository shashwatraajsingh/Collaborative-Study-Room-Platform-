import { Injectable } from '@nestjs/common';
import { SessionsService } from '../sessions/sessions.service';
import { RoomsService } from '../rooms/rooms.service';

const DAILY_BREAKDOWN_DAYS = 7;

interface DashboardStats {
  totalStudyTimeSeconds: number;
  totalSessionsCount: number;
  roomsJoined: number;
  dailyBreakdown: Array<{
    date: string;
    totalSeconds: number;
    sessionCount: number;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly roomsService: RoomsService,
  ) {}

  async getUserDashboard(userId: string): Promise<DashboardStats> {
    const [studyStats, userRooms, dailyBreakdown] = await Promise.all([
      this.sessionsService.getUserStudyStats(userId),
      this.roomsService.getUserRooms(userId),
      this.sessionsService.getDailyBreakdown(userId, DAILY_BREAKDOWN_DAYS),
    ]);

    return {
      totalStudyTimeSeconds: studyStats.totalStudyTimeSeconds,
      totalSessionsCount: studyStats.totalSessionsCount,
      roomsJoined: userRooms.length,
      dailyBreakdown,
    };
  }
}
