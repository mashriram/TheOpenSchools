import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateStudentEnrolmentDto {
  @IsUUID('4')
  schoolYearId: string;

  @IsUUID('4')
  yearGroupId: string;

  @IsUUID('4')
  formGroupId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  rollOrder?: number;
}
