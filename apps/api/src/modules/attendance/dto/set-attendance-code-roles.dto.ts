import { IsUUID } from 'class-validator';

export class SetAttendanceCodeRolesDto {
  @IsUUID('4', { each: true })
  roleIds: string[];
}
