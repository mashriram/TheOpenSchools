import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type { MessengerMethod } from '../entities/messenger.entity';
import { MessengerTargetDto } from './messenger-target.dto';

export const MESSENGER_METHODS: MessengerMethod[] = [
  'Email',
  'SMS',
  'MessageWall',
];

export class CreateMessengerDto {
  // Used to resolve FormGroup/YearGroup audience targets against the right
  // year's enrolment - see MessengerService.resolveRecipients().
  @IsUUID('4')
  schoolYearId: string;

  @IsString()
  @MaxLength(255)
  subject: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsIn(MESSENGER_METHODS)
  method?: MessengerMethod;

  @IsOptional()
  @IsBoolean()
  confidential?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MessengerTargetDto)
  targets: MessengerTargetDto[];
}
