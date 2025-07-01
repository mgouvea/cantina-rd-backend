import { PartialType } from '@nestjs/mapped-types';

export class CreateDebitDto {
  groupFamilyId: string;
  amount: number;
  includedInInvoice: boolean;
  invoiceId?: string;
  createdAt: Date;
}

export class UpdateDebitDto extends PartialType(CreateDebitDto) {}
