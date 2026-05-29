import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(2, { message: 'Room name must be at least 2 characters' })
  @MaxLength(200, { message: 'Room name must be at most 200 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must be at most 1000 characters' })
  description?: string;
}
