import { IsIn, IsString, MaxLength } from 'class-validator';
import {
  ROLE_CATEGORIES,
  ROLE_RESTRICTIONS,
  type RoleCategory,
  type RoleRestriction,
} from '@purpleschools/shared-types';

export class CreateRoleDto {
  @IsIn(ROLE_CATEGORIES)
  category: RoleCategory;

  @IsString()
  @MaxLength(40)
  name: string;

  @IsString()
  @MaxLength(8)
  shortName: string;

  @IsString()
  @MaxLength(120)
  description: string;

  @IsIn(ROLE_RESTRICTIONS)
  restriction: RoleRestriction;
}
