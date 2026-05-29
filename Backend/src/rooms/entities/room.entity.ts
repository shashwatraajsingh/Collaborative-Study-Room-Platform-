import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RoomMember } from './room-member.entity';
import { StudySession } from '../../sessions/entities/study-session.entity';
import { Message } from '../../messages/entities/message.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @Column({ type: 'varchar', length: 8, unique: true })
  inviteCode!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.ownedRooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @OneToMany(() => RoomMember, (member) => member.room)
  members!: RoomMember[];

  @OneToMany(() => StudySession, (session) => session.room)
  studySessions!: StudySession[];

  @OneToMany(() => Message, (message) => message.room)
  messages!: Message[];
}
