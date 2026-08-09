import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AddCalendarEditorDto {
  @IsUUID('4')
  personId: string;

  @IsOptional()
  @IsBoolean()
  editAllEvents?: boolean;
}
