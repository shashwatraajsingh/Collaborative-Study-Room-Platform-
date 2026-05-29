import { IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';

export class GetMessagesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsUUID('4', { message: 'before must be a valid message UUID' })
  before?: string;
}
