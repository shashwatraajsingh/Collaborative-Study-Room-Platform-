import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities/user.entity';

@Entity('study_sessions')
export class StudySession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  roomId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @Column({ type: 'integer', nullable: true })
  durationSeconds!: number | null;

  @ManyToOne(() => Room, (room) => room.studySessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room!: Room;

  @ManyToOne(() => User, (user) => user.studySessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
