import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { RoomMember } from '../../rooms/entities/room-member.entity';
import { Room } from '../../rooms/entities/room.entity';
import { StudySession } from '../../sessions/entities/study-session.entity';
import { Message } from '../../messages/entities/message.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => Room, (room) => room.owner)
  ownedRooms!: Room[];

  @OneToMany(() => RoomMember, (member) => member.user)
  roomMemberships!: RoomMember[];

  @OneToMany(() => StudySession, (session) => session.user)
  studySessions!: StudySession[];

  @OneToMany(() => Message, (message) => message.user)
  messages!: Message[];
}
