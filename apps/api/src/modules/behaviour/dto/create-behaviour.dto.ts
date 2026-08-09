import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import type { BehaviourType } from '../entities/behaviour.entity';

export const BEHAVIOUR_TYPES: BehaviourType[] = [
  'Positive',
  'Negative',
  'Observation',
];

export class CreateBehaviourDto {
  @IsUUID('4')
  schoolYearId: string;

  @IsDateString()
  date: string;

  @IsUUID('4')
  personId: string;

  @IsIn(BEHAVIOUR_TYPES)
  type: BehaviourType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  descriptor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  level?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  followup?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  multiIncidentId?: string;
}
