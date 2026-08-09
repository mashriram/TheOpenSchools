import { PartialType } from '@nestjs/mapped-types';
import { CreateFeeCategoryDto } from './create-fee-category.dto';

export class UpdateFeeCategoryDto extends PartialType(CreateFeeCategoryDto) {}
