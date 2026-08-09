import { IsString } from 'class-validator';

export class CreateFollowUpDto {
  @IsString()
  followUp: string;
}
