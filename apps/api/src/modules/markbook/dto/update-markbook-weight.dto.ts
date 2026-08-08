import { PartialType } from '@nestjs/mapped-types';
import { CreateMarkbookWeightDto } from './create-markbook-weight.dto';

export class UpdateMarkbookWeightDto extends PartialType(
  CreateMarkbookWeightDto,
) {}
