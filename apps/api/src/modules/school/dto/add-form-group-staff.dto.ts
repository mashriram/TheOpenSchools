import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import {
  FORM_GROUP_STAFF_ROLES,
  type FormGroupStaffRole,
} from '@purpleschools/shared-types';

export class AddFormGroupStaffDto {
  @IsUUID('4')
  personId: string;

  @IsIn(FORM_GROUP_STAFF_ROLES)
  role: FormGroupStaffRole;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
