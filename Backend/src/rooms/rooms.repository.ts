import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { RoomMember, RoomRole } from './entities/room-member.entity';

const INVITE_CODE_LENGTH = 8;
const INVITE_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

@Injectable()
export class RoomsRepository {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(RoomMember)
    private readonly memberRepo: Repository<RoomMember>,
  ) {}

  async createRoom(data: {
    name: string;
    description?: string;
    ownerId: string;
  }): Promise<Room> {
    const inviteCode = this.generateInviteCode();
    const room = this.roomRepo.create({
      name: data.name,
      description: data.description ?? null,
      ownerId: data.ownerId,
      inviteCode,
      isActive: true,
    });
    return this.roomRepo.save(room);
  }

  async addMember(roomId: string, userId: string, role: RoomRole): Promise<RoomMember> {
    const member = this.memberRepo.create({ roomId, userId, role });
    return this.memberRepo.save(member);
  }

  async findMembershipByRoomAndUser(
    roomId: string,
    userId: string,
  ): Promise<RoomMember | null> {
    return this.memberRepo.findOne({ where: { roomId, userId } });
  }

  async findRoomsByUserId(userId: string): Promise<Room[]> {
    return this.roomRepo
      .createQueryBuilder('room')
      .innerJoin('room.members', 'member', 'member.userId = :userId', { userId })
      .where('room.isActive = :isActive', { isActive: true })
      .orderBy('room.createdAt', 'DESC')
      .getMany();
  }

  async findRoomById(roomId: string): Promise<Room | null> {
    return this.roomRepo.findOne({
      where: { id: roomId, isActive: true },
      relations: ['members', 'members.user'],
    });
  }

  async findRoomByInviteCode(inviteCode: string): Promise<Room | null> {
    return this.roomRepo.findOne({
      where: { inviteCode, isActive: true },
    });
  }

  async softDeleteRoom(roomId: string): Promise<void> {
    await this.roomRepo.update(roomId, { isActive: false });
  }

  async isRoomOwner(roomId: string, userId: string): Promise<boolean> {
    const room = await this.roomRepo.findOne({
      where: { id: roomId, ownerId: userId },
    });
    return room !== null;
  }

  private generateInviteCode(): string {
    let code = '';
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * INVITE_CODE_CHARSET.length);
      code += INVITE_CODE_CHARSET[randomIndex];
    }
    return code;
  }
}
