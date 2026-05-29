import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { Room } from './entities/room.entity';
import { RoomMember } from './entities/room-member.entity';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async createRoom(
    @Body() dto: CreateRoomDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Room> {
    return this.roomsService.createRoom(dto, user.sub);
  }

  @Get('my')
  async getMyRooms(@CurrentUser() user: JwtPayload): Promise<Room[]> {
    return this.roomsService.getUserRooms(user.sub);
  }

  @Get(':id')
  async getRoomDetails(@Param('id') roomId: string): Promise<Room> {
    return this.roomsService.getRoomDetails(roomId);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  async joinRoom(
    @Body() dto: JoinRoomDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<RoomMember> {
    return this.roomsService.joinRoomByInviteCode(dto.inviteCode, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteRoom(
    @Param('id') roomId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string }> {
    await this.roomsService.deleteRoom(roomId, user.sub);
    return { message: 'Room successfully deleted' };
  }
}
