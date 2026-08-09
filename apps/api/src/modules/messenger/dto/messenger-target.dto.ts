import { IsIn, IsUUID } from 'class-validator';
import type { MessengerTargetType } from '../entities/messenger-target.entity';

export const MESSENGER_TARGET_TYPES: MessengerTargetType[] = [
  'Role',
  'FormGroup',
  'YearGroup',
  'House',
  'Person',
  'MailingList',
];

export class MessengerTargetDto {
  @IsIn(MESSENGER_TARGET_TYPES)
  targetType: MessengerTargetType;

  @IsUUID('4')
  targetId: string;
}
