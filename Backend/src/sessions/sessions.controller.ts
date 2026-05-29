import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { StudySession } from './entities/study-session.entity';

@Controller('rooms/:id/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  async startSession(
    @Param('id') roomId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<StudySession> {
    return this.sessionsService.startStudySession(roomId, user.sub);
  }

  @Post('end')
  @HttpCode(HttpStatus.OK)
  async endSession(
    @Param('id') roomId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<StudySession> {
    return this.sessionsService.endStudySession(roomId, user.sub);
  }

  @Get()
  async getSessionHistory(
    @Param('id') roomId: string,
  ): Promise<StudySession[]> {
    return this.sessionsService.getRoomSessionHistory(roomId);
  }
}
