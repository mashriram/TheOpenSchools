import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID('4')
  schoolYearId: string;

  @IsUUID('4')
  invoiceeId: string;

  @IsOptional()
  @IsUUID('4')
  billingScheduleId?: string;

  @IsOptional()
  @IsDateString()
  invoiceIssueDate?: string;

  @IsOptional()
  @IsDateString()
  invoiceDueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  retentionPeriodMonths?: number;
}
