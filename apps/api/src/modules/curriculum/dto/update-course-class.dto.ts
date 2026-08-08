import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseClassDto } from './create-course-class.dto';

export class UpdateCourseClassDto extends PartialType(CreateCourseClassDto) {}
