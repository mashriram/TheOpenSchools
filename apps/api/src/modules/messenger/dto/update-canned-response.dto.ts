import { PartialType } from '@nestjs/mapped-types';
import { CreateCannedResponseDto } from './create-canned-response.dto';

export class UpdateCannedResponseDto extends PartialType(
  CreateCannedResponseDto,
) {}
