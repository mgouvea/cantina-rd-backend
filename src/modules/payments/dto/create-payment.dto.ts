import { PartialType } from '@nestjs/mapped-types';

export class CreatePaymentDto {
  invoiceId: string;
  amountPaid: number;
  baseAmount?: number;
  paymentDate: Date;
  isPartial: boolean;
  isCredit: boolean;
  createdAt: Date;
}

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
