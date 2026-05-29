import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('me')
  async getMyDashboard(@CurrentUser() user: JwtPayload): Promise<{
    totalStudyTimeSeconds: number;
    totalSessionsCount: number;
    roomsJoined: number;
    dailyBreakdown: Array<{
      date: string;
      totalSeconds: number;
      sessionCount: number;
    }>;
  }> {
    return this.dashboardService.getUserDashboard(user.sub);
  }
}
