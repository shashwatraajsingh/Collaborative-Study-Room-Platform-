import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { RoomsRepository } from './rooms.repository';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from './entities/room.entity';
import { RoomMember, RoomRole } from './entities/room-member.entity';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(private readonly roomsRepository: RoomsRepository) {}

  async createRoom(dto: CreateRoomDto, ownerId: string): Promise<Room> {
    const room = await this.roomsRepository.createRoom({
      name: dto.name,
      description: dto.description,
      ownerId,
    });

    await this.roomsRepository.addMember(room.id, ownerId, RoomRole.OWNER);
    this.logger.log(`Room "${room.name}" created by user ${ownerId} (code: ${room.inviteCode})`);

    return room;
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    return this.roomsRepository.findRoomsByUserId(userId);
  }

  async getRoomDetails(roomId: string): Promise<Room> {
    const room = await this.roomsRepository.findRoomById(roomId);
    if (!room) {
      throw new NotFoundException(`Room with id "${roomId}" not found`);
    }
    return room;
  }

  async joinRoomByInviteCode(inviteCode: string, userId: string): Promise<RoomMember> {
    const room = await this.roomsRepository.findRoomByInviteCode(inviteCode);
    if (!room) {
      throw new NotFoundException('No active room found with this invite code');
    }

    const existingMembership = await this.roomsRepository.findMembershipByRoomAndUser(
      room.id,
      userId,
    );
    if (existingMembership) {
      throw new ConflictException('You are already a member of this room');
    }

    const member = await this.roomsRepository.addMember(room.id, userId, RoomRole.MEMBER);
    this.logger.log(`User ${userId} joined room "${room.name}" (${room.id})`);

    return member;
  }

  async deleteRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.roomsRepository.findRoomById(roomId);
    if (!room) {
      throw new NotFoundException(`Room with id "${roomId}" not found`);
    }

    const isOwner = await this.roomsRepository.isRoomOwner(roomId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Only the room owner can delete this room');
    }

    await this.roomsRepository.softDeleteRoom(roomId);
    this.logger.log(`Room "${room.name}" (${roomId}) soft-deleted by owner ${userId}`);
  }

  async verifyMembership(roomId: string, userId: string): Promise<void> {
    const membership = await this.roomsRepository.findMembershipByRoomAndUser(roomId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this room');
    }
  }
}
