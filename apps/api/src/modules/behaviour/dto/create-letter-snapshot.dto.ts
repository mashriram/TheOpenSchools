import { IsIn, IsString, IsUUID } from 'class-validator';
import type {
  BehaviourLetterLevel,
  BehaviourLetterStatus,
  BehaviourLetterType,
} from '../entities/behaviour-letter-snapshot.entity';

export const BEHAVIOUR_LETTER_LEVELS: BehaviourLetterLevel[] = ['1', '2', '3'];
export const BEHAVIOUR_LETTER_STATUSES: BehaviourLetterStatus[] = [
  'Warning',
  'Issued',
];
export const BEHAVIOUR_LETTER_TYPES: BehaviourLetterType[] = [
  'Negative',
  'Positive',
];

export class CreateLetterSnapshotDto {
  @IsUUID('4')
  schoolYearId: string;

  @IsUUID('4')
  personId: string;

  @IsIn(BEHAVIOUR_LETTER_LEVELS)
  letterLevel: BehaviourLetterLevel;

  @IsIn(BEHAVIOUR_LETTER_STATUSES)
  status: BehaviourLetterStatus;

  @IsIn(BEHAVIOUR_LETTER_TYPES)
  type: BehaviourLetterType;

  // Composed/reviewed by the sending admin/teacher, not server-templated -
  // see BehaviourLetterSnapshot's doc comment: automatic generation is a
  // documented MVP deferral, matching every other "automatic" flag in this
  // cluster (Alert.automatic, AlertType.automatic).
  @IsString()
  body: string;
}
