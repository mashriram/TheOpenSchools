import { IsOptional, IsUUID } from 'class-validator';

export class UpdateScheduledClassSpaceDto {
  @IsOptional()
  @IsUUID('4')
  spaceId?: string;
}
