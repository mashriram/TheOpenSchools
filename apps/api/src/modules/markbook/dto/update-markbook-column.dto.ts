import { PartialType } from '@nestjs/mapped-types';
import { CreateMarkbookColumnDto } from './create-markbook-column.dto';

export class UpdateMarkbookColumnDto extends PartialType(
  CreateMarkbookColumnDto,
) {}
