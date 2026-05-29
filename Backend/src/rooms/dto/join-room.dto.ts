import { IsString, Length } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @Length(8, 8, { message: 'Invite code must be exactly 8 characters' })
  inviteCode!: string;
}
