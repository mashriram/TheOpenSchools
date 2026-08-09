import { IsString, MaxLength } from 'class-validator';

export class CreateCannedResponseDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  body: string;
}
