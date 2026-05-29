import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SessionsModule } from '../sessions/sessions.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [SessionsModule, RoomsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
