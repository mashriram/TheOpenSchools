import { PartialType } from '@nestjs/mapped-types';
import { CreateScaleGradeDto } from './create-scale-grade.dto';

export class UpdateScaleGradeDto extends PartialType(CreateScaleGradeDto) {}
