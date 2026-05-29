import { IsString, IsUUID } from 'class-validator';

export class JoinRoomWsDto {
  @IsUUID('4', { message: 'roomId must be a valid UUID' })
  roomId!: string;

  @IsString({ message: 'token is required for authentication' })
  token!: string;
}
