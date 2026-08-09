import { PartialType } from '@nestjs/mapped-types';
import { CreateMailingListDto } from './create-mailing-list.dto';

export class UpdateMailingListDto extends PartialType(CreateMailingListDto) {}
