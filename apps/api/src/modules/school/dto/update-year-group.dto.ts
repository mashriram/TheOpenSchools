import { PartialType } from '@nestjs/mapped-types';
import { CreateYearGroupDto } from './create-year-group.dto';

export class UpdateYearGroupDto extends PartialType(CreateYearGroupDto) {}
