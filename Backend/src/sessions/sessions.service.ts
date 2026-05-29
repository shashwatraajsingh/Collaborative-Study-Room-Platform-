import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { SessionsRepository } from './sessions.repository';
import { StudySession } from './entities/study-session.entity';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async startStudySession(roomId: string, userId: string): Promise<StudySession> {
    const activeSession = await this.sessionsRepository.findActiveSession(roomId, userId);
    if (activeSession) {
      throw new ConflictException('You already have an active study session in this room');
    }

    const session = await this.sessionsRepository.startSession(roomId, userId);
    this.logger.log(`Study session started: user ${userId} in room ${roomId}`);

    return session;
  }

  async endStudySession(roomId: string, userId: string): Promise<StudySession> {
    const activeSession = await this.sessionsRepository.findActiveSession(roomId, userId);
    if (!activeSession) {
      throw new NotFoundException('No active study session found in this room');
    }

    const endedAt = new Date();
    const durationSeconds = Math.floor(
      (endedAt.getTime() - activeSession.startedAt.getTime()) / 1000,
    );

    const endedSession = await this.sessionsRepository.endSession(
      activeSession,
      endedAt,
      durationSeconds,
    );

    this.logger.log(
      `Study session ended: user ${userId} in room ${roomId}, duration: ${durationSeconds}s`,
    );

    return endedSession;
  }

  async getRoomSessionHistory(roomId: string): Promise<StudySession[]> {
    return this.sessionsRepository.findRoomSessionHistory(roomId);
  }

  async getUserStudyStats(userId: string): Promise<{
    totalStudyTimeSeconds: number;
    totalSessionsCount: number;
  }> {
    return this.sessionsRepository.getUserStudyStats(userId);
  }

  async getDailyBreakdown(
    userId: string,
    days: number,
  ): Promise<Array<{ date: string; totalSeconds: number; sessionCount: number }>> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    fromDate.setHours(0, 0, 0, 0);

    return this.sessionsRepository.getDailyBreakdown(userId, fromDate);
  }
}
