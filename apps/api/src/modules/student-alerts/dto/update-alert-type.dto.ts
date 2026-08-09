import { PartialType } from '@nestjs/mapped-types';
import { CreateAlertTypeDto } from './create-alert-type.dto';

export class UpdateAlertTypeDto extends PartialType(CreateAlertTypeDto) {}
