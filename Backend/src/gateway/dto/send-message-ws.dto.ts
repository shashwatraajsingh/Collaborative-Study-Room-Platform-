import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class SendMessageWsDto {
  @IsUUID('4', { message: 'roomId must be a valid UUID' })
  roomId!: string;

  @IsString()
  @MinLength(1, { message: 'Message content cannot be empty' })
  @MaxLength(5000, { message: 'Message content must be at most 5000 characters' })
  content!: string;
}
