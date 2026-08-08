import { IsIn, IsOptional } from 'class-validator';
import {
  INDIVIDUAL_NEED_DESCRIPTOR_TYPES,
  SAFEGUARDING_SEVERITY_LEVELS,
  type IndividualNeedDescriptorType,
  type SafeguardingSeverityLevel,
} from '@purpleschools/shared-types';

export class SetPersonDescriptorDto {
  @IsIn(INDIVIDUAL_NEED_DESCRIPTOR_TYPES)
  descriptor: IndividualNeedDescriptorType;

  @IsOptional()
  @IsIn(SAFEGUARDING_SEVERITY_LEVELS)
  level?: SafeguardingSeverityLevel;
}
