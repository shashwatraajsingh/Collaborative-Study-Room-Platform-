import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from '../../users/entities/user.entity';

export enum RoomRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

@Entity('room_members')
@Unique(['roomId', 'userId'])
export class RoomMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  roomId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt!: Date;

  @Column({ type: 'enum', enum: RoomRole, default: RoomRole.MEMBER })
  role!: RoomRole;

  @ManyToOne(() => Room, (room) => room.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room!: Room;

  @ManyToOne(() => User, (user) => user.roomMemberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
