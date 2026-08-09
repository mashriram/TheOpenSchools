import { IsUUID } from 'class-validator';

export class AddMailingListRecipientDto {
  @IsUUID('4')
  personId: string;
}
