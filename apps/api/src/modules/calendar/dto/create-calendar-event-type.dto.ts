import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCalendarEventTypeDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @IsOptional()
  @IsInt()
  sequenceNumber?: number;
}
