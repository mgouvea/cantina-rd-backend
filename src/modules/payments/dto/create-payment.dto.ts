import { PartialType } from '@nestjs/mapped-types';

export class CreatePaymentDto {
  invoiceId: string;
  amountPaid: number;
  paymentDate: Date;
  isPartial: boolean;
  createdAt: Date;
}

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
