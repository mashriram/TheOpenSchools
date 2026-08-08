import { IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export class CreateTimetableDayDto {
  @IsUUID('4')
  timetableColumnId: string;

  @IsString()
  @MaxLength(12)
  name: string;

  @IsString()
  @MaxLength(4)
  shortName: string;

  @Matches(HEX_COLOR_PATTERN, {
    message: 'color must be a hex value like #RRGGBB',
  })
  color: string;

  @Matches(HEX_COLOR_PATTERN, {
    message: 'fontColor must be a hex value like #RRGGBB',
  })
  fontColor: string;
}
