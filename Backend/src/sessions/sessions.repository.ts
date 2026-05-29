import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { StudySession } from './entities/study-session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectRepository(StudySession)
    private readonly sessionRepo: Repository<StudySession>,
  ) {}

  async findActiveSession(roomId: string, userId: string): Promise<StudySession | null> {
    return this.sessionRepo.findOne({
      where: {
        roomId,
        userId,
        endedAt: IsNull(),
      },
    });
  }

  async startSession(roomId: string, userId: string): Promise<StudySession> {
    const session = this.sessionRepo.create({
      roomId,
      userId,
    });
    return this.sessionRepo.save(session);
  }

  async endSession(session: StudySession, endedAt: Date, durationSeconds: number): Promise<StudySession> {
    session.endedAt = endedAt;
    session.durationSeconds = durationSeconds;
    return this.sessionRepo.save(session);
  }

  async findRoomSessionHistory(roomId: string): Promise<StudySession[]> {
    return this.sessionRepo.find({
      where: { roomId },
      relations: ['user'],
      order: { startedAt: 'DESC' },
    });
  }

  async getUserStudyStats(userId: string): Promise<{
    totalStudyTimeSeconds: number;
    totalSessionsCount: number;
  }> {
    const result = await this.sessionRepo
      .createQueryBuilder('session')
      .select('COALESCE(SUM(session.durationSeconds), 0)', 'totalStudyTimeSeconds')
      .addSelect('COUNT(session.id)', 'totalSessionsCount')
      .where('session.userId = :userId', { userId })
      .andWhere('session.endedAt IS NOT NULL')
      .getRawOne<{ totalStudyTimeSeconds: string; totalSessionsCount: string }>();

    return {
      totalStudyTimeSeconds: parseInt(result?.totalStudyTimeSeconds ?? '0', 10),
      totalSessionsCount: parseInt(result?.totalSessionsCount ?? '0', 10),
    };
  }

  async getDailyBreakdown(
    userId: string,
    fromDate: Date,
  ): Promise<Array<{ date: string; totalSeconds: number; sessionCount: number }>> {
    const rawResults = await this.sessionRepo
      .createQueryBuilder('session')
      .select("TO_CHAR(session.startedAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(session.durationSeconds), 0)', 'totalSeconds')
      .addSelect('COUNT(session.id)', 'sessionCount')
      .where('session.userId = :userId', { userId })
      .andWhere('session.startedAt >= :fromDate', { fromDate })
      .andWhere('session.endedAt IS NOT NULL')
      .groupBy("TO_CHAR(session.startedAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; totalSeconds: string; sessionCount: string }>();

    return rawResults.map((row) => ({
      date: row.date,
      totalSeconds: parseInt(row.totalSeconds, 10),
      sessionCount: parseInt(row.sessionCount, 10),
    }));
  }
}
