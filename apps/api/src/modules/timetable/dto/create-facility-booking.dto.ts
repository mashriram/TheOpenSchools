import {
  IsDateString,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;

export class CreateFacilityBookingDto {
  @IsUUID('4')
  spaceId: string;

  @IsUUID('4')
  personId: string;

  @IsDateString()
  date: string;

  @Matches(TIME_PATTERN, {
    message: 'timeStart must be in HH:MM or HH:MM:SS format',
  })
  timeStart: string;

  @Matches(TIME_PATTERN, {
    message: 'timeEnd must be in HH:MM or HH:MM:SS format',
  })
  timeEnd: string;

  @IsString()
  @MaxLength(255)
  reason: string;
}
