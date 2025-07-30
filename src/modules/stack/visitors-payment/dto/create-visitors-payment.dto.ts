import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateVisitorsPaymentDto {
  @IsString()
  invoiceId: string;

  @IsNumber()
  amountPaid: number;

  @IsBoolean()
  isPartial: boolean;
}

export class UpdateVisitorsPaymentDto extends PartialType(
  CreateVisitorsPaymentDto,
) {}
