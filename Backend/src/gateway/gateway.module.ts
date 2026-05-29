import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StudyRoomGateway } from './study-room.gateway';
import { MessagesModule } from '../messages/messages.module';
import { SessionsModule } from '../sessions/sessions.module';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    JwtModule.register({}),
    MessagesModule,
    SessionsModule,
    RoomsModule,
    UsersModule,
  ],
  providers: [StudyRoomGateway],
})
export class GatewayModule {}
