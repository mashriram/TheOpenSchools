import { IsString, MaxLength } from 'class-validator';

export class CreateMailingListDto {
  @IsString()
  @MaxLength(60)
  name: string;
}
