import { IsUUID } from 'class-validator';

export class UpdateMarkbookTargetDto {
  @IsUUID('4')
  targetScaleGradeId: string;
}
