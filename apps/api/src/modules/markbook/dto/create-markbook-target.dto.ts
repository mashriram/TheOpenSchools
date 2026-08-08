import { IsUUID } from 'class-validator';

export class CreateMarkbookTargetDto {
  @IsUUID('4')
  personId: string;

  @IsUUID('4')
  targetScaleGradeId: string;
}
